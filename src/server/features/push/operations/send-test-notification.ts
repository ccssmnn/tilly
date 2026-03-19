import type { co } from "jazz-tools"
import type { ServerAccount } from "#shared/schema/server"
import { getEnabledDevices } from "../lib/device-management"
import { sendNotificationToDevice } from "../lib/send-notification"
import { getIntl } from "../lib/localization"

export { sendTestNotification }
export type { SendTestResult }

type SendTestResult =
	| { ok: true }
	| { ok: false; error: string; status: 400 | 409 | 500 }

async function sendTestNotification(
	serverWorker: co.loaded<typeof ServerAccount>,
	userId: string,
	endpoint: string,
): Promise<SendTestResult> {
	let serverState = await serverWorker.$jazz.ensureLoaded({
		resolve: {
			root: {
				notificationSettingsRefsV2: {
					$each: { notificationSettings: true },
				},
			},
		},
	})

	let refs = serverState.root.notificationSettingsRefsV2
	if (!refs) {
		return {
			ok: false,
			error: "Notification settings not configured",
			status: 400,
		}
	}

	let ref = Object.values(refs).find(ref => ref?.userId === userId)
	let notificationSettings = ref?.notificationSettings

	if (!notificationSettings?.$isLoaded) {
		let t = getIntl({ root: { language: "en" } })
		return {
			ok: false,
			error: t("server.error.notificationSettingsNotConfigured"),
			status: 400,
		}
	}

	let t = getIntl({ root: { language: notificationSettings.language } })

	let devices = getEnabledDevices(notificationSettings)
	let device = devices.find(d => d.endpoint === endpoint)
	if (!device) {
		return { ok: false, error: t("server.error.deviceNotInList"), status: 409 }
	}

	let testPayload = {
		title: t("server.push.test-title"),
		body: t("server.push.test-body"),
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		url: "/app/settings",
		userId,
		isTest: true,
	}

	let sendResult = await sendNotificationToDevice(device, testPayload)
	if (!sendResult.ok) {
		console.error("Failed to send test notification:", sendResult.error)
		return {
			ok: false,
			error: t("server.error.failedToSendNotification"),
			status: 500,
		}
	}

	return { ok: true }
}
