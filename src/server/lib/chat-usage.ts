import { tryCatch } from "#shared/lib/trycatch"
import { UsageTracking, UserAccount } from "#shared/schema/user"
import type { ModelMessage } from "ai"
import {
	CACHED_INPUT_TOKEN_COST_PER_MILLION,
	INPUT_TOKEN_COST_PER_MILLION,
	MAX_REQUEST_TOKENS,
	OUTPUT_TOKEN_COST_PER_MILLION,
	WEEKLY_BUDGET,
} from "astro:env/server"
import { addDays, isPast } from "date-fns"
import { co, Group, type ResolveQuery } from "jazz-tools"
import { clerkClient } from "./auth-client"
import { type SubscriptionStatus } from "./chat-subscription"
import { initServerWorker, initUserWorker } from "./utils"

export { checkInputSize, checkUsageLimits, updateUsage }

function checkInputSize(
	user: ChatUser,
	messages: Array<TokenCountMessage | ModelMessage>,
) {
	let estimatedTokens = estimateTokenCount(messages)

	if (estimatedTokens > MAX_REQUEST_TOKENS) {
		let overflow = estimatedTokens - MAX_REQUEST_TOKENS
		console.warn(
			`[Chat] ${user.id} | Request too large: ${estimatedTokens} tokens exceeds limit by ${overflow}`,
		)
		return false
	}

	return true
}

async function checkUsageLimits(
	user: ChatUser,
	worker: UserWorker,
): Promise<UsageLimitResult> {
	let context = await ensureUsageContext(user, worker)
	let percentUsed = context.usageTracking.weeklyPercentUsed ?? 0

	let exceeded = percentUsed >= 100

	if (exceeded) {
		let resetDate = context.usageTracking.resetDate
		let remainingPercent = Math.max(0, 100 - percentUsed).toFixed(1)
		let resetLabel = resetDate ? resetDate.toISOString() : "unknown"

		console.warn(
			`[Chat] ${user.id} | Usage limit exceeded | Remaining ${remainingPercent}% | Reset ${resetLabel}`,
		)
	}

	return {
		exceeded,
		percentUsed,
		resetDate: context.usageTracking.resetDate,
	}
}

async function updateUsage(
	user: ChatUser,
	worker: UserWorker,
	subscription: SubscriptionStatus,
	usage: UsageUpdatePayload,
): Promise<void> {
	let context = await ensureUsageContext(user, worker)

	let updateResult = await tryCatch(
		applyUsageUpdate(context.usageTracking, usage),
	)

	if (!updateResult.ok) {
		console.error(
			`[Usage] ${user.id} | Failed to update usage`,
			updateResult.error,
		)
		throw new Error("Failed to update usage")
	}

	let update = updateResult.data

	context.usageTracking.$jazz.set("weeklyPercentUsed", update.percentUsed)

	let cacheHit = usage.cachedTokens > 0
	let usagePercent = update.percentUsed.toFixed(1)

	console.log(
		`[Chat] ${user.id} | tokens(in=${usage.inputTokens}, cached=${usage.cachedTokens}, out=${usage.outputTokens}) | cacheHit=${cacheHit ? "yes" : "no"} | cost=$${update.cost.toFixed(4)} | usage=${usagePercent}% | tier=${subscription.tier} | trial=${subscription.isTrial ? "yes" : "no"}`,
	)
}

type ChatUser = {
	id: string
	unsafeMetadata: Record<string, unknown>
}

type UsageUpdatePayload = {
	inputTokens: number
	cachedTokens: number
	outputTokens: number
}

type UsageLimitResult = {
	exceeded: boolean
	percentUsed: number
	resetDate: Date
}

type UserWorker = Awaited<ReturnType<typeof initUserWorker>>["worker"]
type ServerWorker = Awaited<ReturnType<typeof initServerWorker>>["worker"]

type UsageContext = {
	worker: UserWorker
	usageTracking: co.loaded<typeof UsageTracking>
}

type TokenCountPart = {
	type?: string
	text?: string
	input?: unknown
	output?: unknown
}

type TokenCountMessage = {
	role?: string
	parts?: TokenCountPart[]
	content?: unknown
	toolCalls?: Array<Record<string, unknown>>
}

let usageAttachQuery = {
	profile: true,
	root: { usageTracking: true },
} satisfies ResolveQuery<typeof UserAccount>

async function ensureUsageContext(
	user: ChatUser,
	worker: UserWorker,
): Promise<UsageContext> {
	let usageTracking = await loadUsageTrackingForUser(
		user,
		worker,
		getStoredUsageTrackingId(user),
	)

	await attachUsageTrackingToUser(worker, usageTracking)

	return { worker, usageTracking }
}

async function loadUsageTrackingForUser(
	user: ChatUser,
	userWorker: UserWorker,
	existingUsageId?: string,
): Promise<co.loaded<typeof UsageTracking>> {
	let serverWorkerResult = await tryCatch(initServerWorker())
	if (!serverWorkerResult.ok) {
		console.error(
			`[Usage] ${user.id} | Failed to init server worker`,
			serverWorkerResult.error,
		)
		throw new Error("Failed to init server worker")
	}

	let serverWorker: ServerWorker = serverWorkerResult.data.worker

	if (existingUsageId) {
		let existingResult = await tryCatch(
			UsageTracking.load(existingUsageId, { loadAs: serverWorker }),
		)

		if (existingResult.ok && existingResult.data) {
			let usageTracking = existingResult.data
			await synchronizeUsageTracking(usageTracking)
			await ensureMetadata(user, usageTracking)
			return usageTracking
		}

		if (!existingResult.ok) {
			console.warn(
				`[Usage] ${user.id} | Failed to load existing usage tracking`,
				existingResult.error,
			)
		}
	}

	let nextResetDate = createWeeklyResetDate()

	console.log(
		`[Usage] ${user.id} | Creating usage tracking | Weekly budget ${WEEKLY_BUDGET} | Reset ${nextResetDate.toISOString()}`,
	)

	let usageTrackingGroup = Group.create({ owner: serverWorker })
	usageTrackingGroup.addMember(userWorker, "reader")

	let usageTracking = UsageTracking.create(
		{
			version: 5,
			userId: user.id,
			weeklyPercentUsed: 0,
			resetDate: nextResetDate,
		},
		{ owner: usageTrackingGroup },
	)

	await ensureMetadata(user, usageTracking)

	return usageTracking
}

function getStoredUsageTrackingId(user: ChatUser): string | undefined {
	let storedValue = user.unsafeMetadata.usageTrackingId
	return typeof storedValue === "string" ? storedValue : undefined
}

async function attachUsageTrackingToUser(
	worker: UserWorker,
	usageTracking: co.loaded<typeof UsageTracking>,
): Promise<void> {
	let workerResult = await tryCatch(
		worker.$jazz.ensureLoaded({ resolve: usageAttachQuery }),
	)

	if (!workerResult.ok) {
		console.error(
			`[Usage] ${usageTracking.userId} | Failed to load worker root`,
			workerResult.error,
		)
		throw new Error("Failed to attach usage tracking")
	}

	let workerWithProfile = workerResult.data

	if (!workerWithProfile.root) {
		return
	}

	let currentUsage = workerWithProfile.root.usageTracking
	let desiredUsage = usageTracking

	if (!currentUsage) {
		workerWithProfile.root.$jazz.set("usageTracking", desiredUsage)
		return
	}

	let currentId = currentUsage.$jazz.id
	let desiredId = desiredUsage.$jazz.id

	if (currentId === desiredId) {
		return
	}

	workerWithProfile.root.$jazz.set("usageTracking", desiredUsage)
}

async function synchronizeUsageTracking(
	usageTracking: co.loaded<typeof UsageTracking>,
): Promise<void> {
	let currentResetDate = usageTracking.resetDate

	if (!isPast(currentResetDate)) {
		return
	}

	let nextResetDate = advanceWeeklyReset(currentResetDate)

	console.log(
		`[Usage] ${usageTracking.userId} | Reset usage for new period | Next reset ${nextResetDate.toISOString()}`,
	)

	usageTracking.$jazz.set("weeklyPercentUsed", 0)
	usageTracking.$jazz.set("resetDate", nextResetDate)
}

async function ensureMetadata(
	user: ChatUser,
	usageTracking: co.loaded<typeof UsageTracking>,
): Promise<void> {
	let currentUsageId = usageTracking.$jazz.id
	let storedValue = user.unsafeMetadata.usageTrackingId
	let storedId = typeof storedValue === "string" ? storedValue : undefined

	if (storedId === currentUsageId) {
		return
	}

	let updatedMetadata = {
		...user.unsafeMetadata,
		usageTrackingId: currentUsageId,
	}

	let updateResult = await tryCatch(
		clerkClient.users.updateUserMetadata(user.id, {
			unsafeMetadata: updatedMetadata,
		}),
	)

	if (!updateResult.ok) {
		console.error(
			`[Usage] ${user.id} | Failed to update Clerk metadata`,
			updateResult.error,
		)
		throw new Error("Failed to update user metadata")
	}

	user.unsafeMetadata = updatedMetadata
}

async function applyUsageUpdate(
	usageTracking: co.loaded<typeof UsageTracking>,
	usage: UsageUpdatePayload,
) {
	let serverUsageResult = await tryCatch(
		UsageTracking.load(usageTracking.$jazz.id),
	)

	if (!serverUsageResult.ok || !serverUsageResult.data) {
		throw new Error("Failed to load usage tracking for updates")
	}

	let serverUsageTracking = serverUsageResult.data

	let cost = calculateCost(
		usage.inputTokens,
		usage.outputTokens,
		usage.cachedTokens,
	)

	let percentIncrease = (cost / WEEKLY_BUDGET) * 100

	let previousPercent = serverUsageTracking.weeklyPercentUsed ?? 0

	let newPercent = Math.min(100, previousPercent + percentIncrease)

	serverUsageTracking.$jazz.set("weeklyPercentUsed", newPercent)

	return {
		cost,
		percentUsed: newPercent,
	}
}

function calculateCost(
	inputTokens: number,
	outputTokens: number,
	cachedInputTokens: number,
): number {
	let cachedTokens = cachedInputTokens
	let nonCachedTokens = inputTokens - cachedTokens

	let cachedInputCost =
		(cachedTokens / 1_000_000) * CACHED_INPUT_TOKEN_COST_PER_MILLION
	let nonCachedCost =
		(nonCachedTokens / 1_000_000) * INPUT_TOKEN_COST_PER_MILLION
	let outputCost = (outputTokens / 1_000_000) * OUTPUT_TOKEN_COST_PER_MILLION

	return cachedInputCost + nonCachedCost + outputCost
}

function estimateTokenCount(
	messages: Array<TokenCountMessage | ModelMessage>,
): number {
	let totalChars = 0

	for (let message of messages) {
		let messageChars = 0

		if ("parts" in message && Array.isArray(message.parts)) {
			messageChars += countCharsInParts(message.parts)
		} else if (typeof message.content === "string") {
			messageChars += message.content.length
		} else if (isContentArray(message.content)) {
			messageChars += message.content.reduce((sum, part) => {
				if (typeof part.text === "string") {
					return sum + part.text.length
				}
				return sum
			}, 0)
		} else if (isContentObject(message.content)) {
			messageChars += JSON.stringify(message.content).length
		}

		if ("toolCalls" in message && Array.isArray(message.toolCalls)) {
			for (let toolCall of message.toolCalls) {
				if (toolCall && typeof toolCall === "object") {
					messageChars += JSON.stringify(toolCall).length
				}
			}
		}

		if (typeof message.role === "string") {
			messageChars += message.role.length
		}

		totalChars += messageChars
	}

	return Math.ceil(totalChars / 4)
}

function countCharsInParts(parts: TokenCountPart[]): number {
	return parts.reduce((sum, part) => {
		if (typeof part.text === "string") {
			return sum + part.text.length
		}

		if (typeof part.type === "string" && part.type.startsWith("tool-")) {
			let toolName = part.type.replace("tool-", "")
			let inputStr = JSON.stringify(part.input)
			return sum + toolName.length + inputStr.length
		}

		if (typeof part.output === "string") {
			return sum + part.output.length
		}

		if (part.output && typeof part.output === "object") {
			return sum + JSON.stringify(part.output).length
		}

		return sum
	}, 0)
}

function isContentArray(content: unknown): content is Array<{ text?: string }> {
	return Array.isArray(content)
}

function isContentObject(content: unknown): content is Record<string, unknown> {
	return (
		Boolean(content) && typeof content === "object" && !Array.isArray(content)
	)
}

function createWeeklyResetDate(): Date {
	return addDays(new Date(), 7)
}

function advanceWeeklyReset(previousReset: Date): Date {
	let nextReset = new Date(previousReset)

	do {
		nextReset = addDays(nextReset, 7)
	} while (isPast(nextReset))

	return nextReset
}
