import { tryCatch } from "#shared/lib/trycatch"
import { type User } from "@clerk/backend"
import { PUBLIC_ENABLE_PAYWALL } from "astro:env/client"
import { createMiddleware } from "hono/factory"
import { clerkClient } from "./auth-client"

export { requirePlus }

export type { SubscriptionStatus }

type SubscriptionTier = "plus" | "free"

type SubscriptionStatus = {
	hasPlusAccess: boolean
	tier: SubscriptionTier
	isTrial: boolean
	nextPaymentDate: Date | null
	source: "remote" | "fallback"
}

type BillingSubscription = Awaited<
	ReturnType<typeof clerkClient.billing.getUserBillingSubscription>
>

type RequirePlusAppContext = {
	Variables: {
		user: User
		subscription: SubscriptionStatus
	}
}

let requirePlus = createMiddleware<RequirePlusAppContext>(async (c, next) => {
	let user = c.get("user")
	if (!user) {
		console.warn("[Subscription] Missing authenticated user for requirePlus")
		return c.json({ error: "Authentication required" }, 401)
	}

	let status = await getSubscriptionStatus(user)
	c.set("subscription", status)
	logSubscriptionStatus(user.id, status)

	if (!PUBLIC_ENABLE_PAYWALL) {
		console.warn(
			`[Subscription] ${user.id} | Plus check disabled | tier=${status.tier} | trial=${status.isTrial ? "yes" : "no"} | source=${status.source}`,
		)
		return next()
	}

	if (!status.hasPlusAccess) {
		console.warn(
			`[Subscription] ${user.id} | Access denied | tier=${status.tier} | trial=${status.isTrial ? "yes" : "no"} | source=${status.source}`,
		)
		return c.json({ error: "Plus subscription required" }, 403)
	}

	return next()
})

async function getSubscriptionStatus(user: User): Promise<SubscriptionStatus> {
	let billingResult = await tryCatch(
		clerkClient.billing.getUserBillingSubscription(user.id),
	)
	if (!billingResult.ok) {
		console.warn(
			`[Subscription] ${user.id} | Failed to load billing subscription`,
			billingResult.error,
		)
		return {
			hasPlusAccess: false,
			tier: "free",
			isTrial: false,
			nextPaymentDate: null,
			source: "fallback",
		}
	}

	let subscription = billingResult.data

	if (!subscription) {
		return {
			hasPlusAccess: false,
			tier: "free",
			isTrial: false,
			nextPaymentDate: null,
			source: "remote",
		}
	}

	let snapshot = subscriptionSnapshotFromRemote(subscription)

	return { ...snapshot, source: "remote" }
}

function subscriptionSnapshotFromRemote(
	subscription: BillingSubscription,
): Omit<SubscriptionStatus, "source"> {
	let hasPlusPlan = subscriptionIncludesPlus(subscription)
	let isTrial = subscription.subscriptionItems.some(
		item => item.isFreeTrial === true,
	)
	let nextPaymentDate = subscription.nextPayment
		? new Date(subscription.nextPayment.date)
		: null

	let tier: SubscriptionTier = hasPlusPlan ? "plus" : "free"

	return {
		hasPlusAccess: tier === "plus",
		tier,
		isTrial,
		nextPaymentDate,
	}
}

function subscriptionIncludesPlus(subscription: BillingSubscription): boolean {
	for (let item of subscription.subscriptionItems) {
		let planSlug = item.plan?.slug?.toLowerCase() ?? ""
		let planId = item.planId?.toLowerCase() ?? ""
		let planName = item.plan?.name?.toLowerCase() ?? ""

		let values = [planSlug, planId, planName]
		if (values.includes("plus")) {
			return true
		}
	}

	return false
}

function logSubscriptionStatus(userId: string, status: SubscriptionStatus) {
	let nextPaymentLabel = status.nextPaymentDate
		? status.nextPaymentDate.toISOString()
		: "none"

	console.log(
		`[Subscription] ${userId} | tier=${status.tier} | trial=${status.isTrial ? "yes" : "no"} | source=${status.source} | nextPayment=${nextPaymentLabel}`,
	)
}
