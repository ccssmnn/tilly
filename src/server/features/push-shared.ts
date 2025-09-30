import { PUBLIC_VAPID_KEY } from "astro:env/client"
import { VAPID_PRIVATE_KEY } from "astro:env/server"
import { UserAccount } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import type { co, ResolveQuery } from "jazz-tools"
import webpush from "web-push"
import { createIntl } from "@ccssmnn/intl"
import { messagesEn, messagesDe } from "#shared/intl/messages"

export {
	getEnabledDevices,
	sendNotificationToDevice,
	createNotificationPayload,
	markNotificationSettingsAsDelivered,
	settingsQuery,
	peopleQuery,
	getIntl,
}
export type {
	PushDevice,
	NotificationPayload,
	LoadedUserAccountSettings,
	LoadedUserAccountWithPeople,
	LoadedNotificationSettings,
}

webpush.setVapidDetails(
	"mailto:support@tilly.app",
	PUBLIC_VAPID_KEY,
	VAPID_PRIVATE_KEY,
)

type PushDevice = {
	isEnabled: boolean
	endpoint: string
	keys: {
		p256dh: string
		auth: string
	}
}

type NotificationPayload = {
	title: string
	body: string
	icon: string
	badge: string
	url?: string
	userId?: string
	count?: number
}

let settingsQuery = {
	root: { notificationSettings: true },
} satisfies ResolveQuery<typeof UserAccount>

let peopleQuery = {
	root: {
		people: {
			$each: {
				avatar: true,
				notes: { $each: true },
				reminders: { $each: true },
			},
		},
	},
} satisfies ResolveQuery<typeof UserAccount>

type LoadedUserAccountSettings = co.loaded<
	typeof UserAccount,
	typeof settingsQuery
>
type LoadedUserAccountWithPeople = co.loaded<
	typeof UserAccount,
	typeof peopleQuery
>
type LoadedNotificationSettings = NonNullable<
	LoadedUserAccountSettings["root"]["notificationSettings"]
>

function getEnabledDevices(
	notificationSettings: LoadedNotificationSettings,
	userId?: string,
): PushDevice[] {
	let devices = notificationSettings.pushDevices.filter(d => d.isEnabled) || []
	let logPrefix = userId ? `User ${userId}:` : "User"
	console.log(`${logPrefix} has ${devices.length} enabled devices`)
	return devices
}

function createNotificationPayload(
	reminderCount: number,
	userId?: string,
): NotificationPayload {
	return {
		title: `You have ${reminderCount} ${reminderCount === 1 ? "reminder" : "reminders"} due today`,
		body: "A few moments to reach out could brighten someone's day ✨",
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		url: "/app/reminders",
		userId,
		count: reminderCount,
	}
}

async function sendNotificationToDevice(
	device: PushDevice,
	payload: NotificationPayload,
) {
	return await tryCatch(
		webpush.sendNotification(
			{
				endpoint: device.endpoint,
				keys: {
					p256dh: device.keys.p256dh,
					auth: device.keys.auth,
				},
			},
			JSON.stringify(payload),
		),
	)
}

function markNotificationSettingsAsDelivered(
	notificationSettings: LoadedNotificationSettings,
	currentUtc: Date,
) {
	notificationSettings.$jazz.set("lastDeliveredAt", currentUtc)
	console.log(
		`Marked notifications as delivered at ${currentUtc.toISOString()}`,
	)
}

/**
 * Creates a localized `t` function based on the user's language preference
 *
 * @param worker - Jazz worker loaded with user account settings containing language preference
 * @returns Localized translation function with access to all messages (UI + server)
 *
 * @example
 * ```typescript
 * let t = getIntl(worker)
 * let title = t("server.push.test-title")
 * let errorMsg = t("server.error.deviceNotInList")
 * ```
 */
function getIntl(worker: { root: { language?: string } }) {
	let userLanguage = worker.root.language || "en"

	if (userLanguage === "de") {
		return createIntl(messagesDe, "de")
	} else {
		return createIntl(messagesEn, "en")
	}
}
