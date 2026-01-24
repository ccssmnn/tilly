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
	markNotificationSettingsAsDelivered,
	removeDeviceByEndpoint,
	settingsQuery,
	getIntl,
}
export type {
	PushDevice,
	NotificationPayload,
	LoadedUserAccountSettings,
	LoadedNotificationSettings,
	SendResult,
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
	title?: string
	titleOne?: string
	titleMany?: string
	body: string
	icon: string
	badge: string
	url?: string
	userId?: string
}

let settingsQuery = {
	root: { notificationSettings: true },
} satisfies ResolveQuery<typeof UserAccount>

type LoadedUserAccountSettings = co.loaded<
	typeof UserAccount,
	typeof settingsQuery
>
type LoadedNotificationSettings = NonNullable<
	LoadedUserAccountSettings["root"]["notificationSettings"]
>

function getEnabledDevices(
	notificationSettings: LoadedNotificationSettings,
): PushDevice[] {
	let devices = notificationSettings.pushDevices.filter(d => d.isEnabled) || []
	return devices
}

type SendResult =
	| { ok: true }
	| { ok: false; error: unknown; shouldRemove: boolean }

async function sendNotificationToDevice(
	device: PushDevice,
	payload: NotificationPayload,
): Promise<SendResult> {
	console.log("[Push] Sending to endpoint:", device.endpoint.slice(-20))
	console.log(
		"[Push] Using VAPID public key:",
		PUBLIC_VAPID_KEY.slice(0, 20) + "...",
	)

	let result = await tryCatch(
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

	if (result.ok) {
		return { ok: true }
	}

	// 404/410 = subscription expired/unsubscribed
	// 403 = invalid credentials (stale subscription)
	let statusCode = (result.error as { statusCode?: number })?.statusCode
	let shouldRemove =
		statusCode === 404 || statusCode === 410 || statusCode === 403

	return { ok: false, error: result.error, shouldRemove }
}

function markNotificationSettingsAsDelivered(
	notificationSettings: LoadedNotificationSettings,
	currentUtc: Date,
) {
	notificationSettings.$jazz.set("lastDeliveredAt", currentUtc)
}

function removeDeviceByEndpoint(
	notificationSettings: LoadedNotificationSettings,
	endpoint: string,
) {
	let devices = notificationSettings.pushDevices
	let index = devices.findIndex(d => d.endpoint === endpoint)
	if (index !== -1) {
		devices.splice(index, 1)
		console.log(`🗑️ Removed stale device: ${endpoint.slice(-10)}`)
	}
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
