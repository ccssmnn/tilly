import { PUBLIC_VAPID_KEY } from "astro:env/client"
import { VAPID_PRIVATE_KEY } from "astro:env/server"
import { tryCatch } from "#shared/lib/trycatch"
import webpush from "web-push"

export { sendNotificationToDevice }
export type { PushDevice, NotificationPayload, SendResult }

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

type SendResult =
	| { ok: true }
	| { ok: false; error: unknown; shouldRemove: boolean }

async function sendNotificationToDevice(
	device: PushDevice,
	payload: NotificationPayload,
): Promise<SendResult> {
	console.log(`📤 Sending to: ${device.endpoint.slice(-20)}`)

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
