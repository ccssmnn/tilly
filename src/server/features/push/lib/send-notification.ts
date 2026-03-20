import { PUBLIC_VAPID_KEY } from "astro:env/client"
import { VAPID_PRIVATE_KEY } from "astro:env/server"
import { Result } from "better-result"
import webpush from "web-push"
import { SendFailed } from "#server/lib/errors"

export { sendNotificationToDevice }
export type { PushDevice, NotificationPayload }

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

async function sendNotificationToDevice(
	device: PushDevice,
	payload: NotificationPayload,
): Promise<Result<void, SendFailed>> {
	console.log(`📤 Sending to: ${device.endpoint.slice(-20)}`)

	return Result.tryPromise({
		try: () =>
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
		catch: error => {
			// 404/410 = subscription expired/unsubscribed
			// 403 = invalid credentials (stale subscription)
			let statusCode = (error as { statusCode?: number })?.statusCode
			let shouldRemove =
				statusCode === 404 || statusCode === 410 || statusCode === 403

			return new SendFailed({
				message: String(error),
				shouldRemove,
			})
		},
	}).then(r => r.map(() => undefined))
}
