import { Result } from "better-result"
import type { co } from "jazz-tools"
import type { ServerAccount } from "#shared/schema/server"
import { NotFound, type SendFailed } from "#server/lib/errors"
import { getEnabledDevices } from "../lib/device-management"
import { sendNotificationToDevice } from "../lib/send-notification"
import { getIntl } from "../lib/localization"

export { sendTestNotification }
export type { SendTestError }

type SendTestError = NotFound | SendFailed

async function sendTestNotification(
	serverWorker: co.loaded<typeof ServerAccount>,
	userId: string,
	endpoint: string,
): Promise<Result<void, SendTestError>> {
	return Result.gen(async function* () {
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
			return Result.err(
				new NotFound({
					message: "Notification settings not configured",
				}),
			)
		}

		let ref = Object.values(refs).find(ref => ref?.userId === userId)
		let notificationSettings = ref?.notificationSettings

		if (!notificationSettings?.$isLoaded) {
			let t = getIntl({ root: { language: "en" } })
			return Result.err(
				new NotFound({
					message: t("server.error.notificationSettingsNotConfigured"),
				}),
			)
		}

		let t = getIntl({ root: { language: notificationSettings.language } })

		let devices = getEnabledDevices(notificationSettings)
		let device = devices.find(d => d.endpoint === endpoint)
		if (!device) {
			return Result.err(
				new NotFound({ message: t("server.error.deviceNotInList") }),
			)
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

		yield* Result.await(sendNotificationToDevice(device, testPayload))

		return Result.ok(undefined)
	})
}
