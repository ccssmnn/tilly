import { toZonedTime, format } from "date-fns-tz"
import { Result } from "better-result"
import { co, type ResolveQuery } from "jazz-tools"
import { ServerAccount } from "#shared/schema/server"
import {
	getEnabledDevices,
	removeDeviceByEndpoint,
	markAsDelivered,
} from "../lib/device-management"
import { sendNotificationToDevice } from "../lib/send-notification"
import {
	isPastNotificationTime,
	wasDeliveredToday,
} from "../lib/notification-time"
import { isStaleRef } from "../lib/stale-ref"
import { createLocalizedNotificationPayload } from "../lib/localization"

export { deliverNotifications }
export type { DeliveryResult }

let serverRefsQuery = {
	root: {
		notificationSettingsRefsV2: {
			$each: { notificationSettings: true },
		},
	},
} as const satisfies ResolveQuery<typeof ServerAccount>

type DeliveryResult = {
	message: string
	results: Array<{ userId: string; success: boolean }>
}

async function deliverNotifications(
	worker: co.loaded<typeof ServerAccount>,
): Promise<DeliveryResult> {
	let deliveryResults: Array<{ userId: string; success: boolean }> = []
	let processingPromises: Promise<void>[] = []
	let maxConcurrentUsers = 50

	let serverAccount = await worker.$jazz.ensureLoaded({
		resolve: serverRefsQuery,
	})

	if (!serverAccount || !serverAccount.root) {
		console.log("⚠️ Missing server account or root, aborting cron")
		return { message: "Missing server account or root", results: [] }
	}

	let refs = serverAccount.root.notificationSettingsRefsV2
	if (!refs) {
		console.log("🔔 No notification settings refs found")
		return { message: "No notification settings refs found", results: [] }
	}

	let staleRefKeys: string[] = []
	let currentUtc = new Date()

	for (let [notificationSettingsId, ref] of Object.entries(refs)) {
		if (!ref) continue

		let notificationSettings = ref.notificationSettings
		if (!notificationSettings?.$isLoaded) {
			console.log(`⚠️ User ${ref.userId}: Settings not loaded, skipping`)
			continue
		}

		if (
			isStaleRef(ref.lastSyncedAt, notificationSettings.latestReminderDueDate)
		) {
			staleRefKeys.push(notificationSettingsId)
			console.log(`🗑️ Marking stale ref for removal: ${ref.userId}`)
			continue
		}

		if (processingPromises.length >= maxConcurrentUsers) {
			await Promise.race(processingPromises)
		}

		let { userId } = ref
		let settings = notificationSettings

		let userPromise = (async () => {
			if (!isPastNotificationTime(settings, currentUtc)) {
				let tz = settings.timezone || "UTC"
				let configuredTime = settings.notificationTime || "12:00"
				let localTimeStr = format(toZonedTime(currentUtc, tz), "HH:mm")
				console.log(
					`⏰ User ${userId}: Not past notification time (current: ${localTimeStr}, configured: ${configuredTime}, timezone: ${tz})`,
				)
				return
			}

			if (wasDeliveredToday(settings, currentUtc)) {
				let tz = settings.timezone || "UTC"
				let lastDelivered = settings.lastDeliveredAt
					? format(
							toZonedTime(settings.lastDeliveredAt, tz),
							"yyyy-MM-dd HH:mm",
						)
					: "never"
				console.log(
					`⏰ User ${userId}: Already delivered today (last: ${lastDelivered})`,
				)
				return
			}

			console.log(`✅ User ${userId}: Passed notification time checks`)

			let enabledDevices = getEnabledDevices(settings)
			if (enabledDevices.length === 0) {
				markAsDelivered(settings, currentUtc)
				console.log(
					`✅ User ${userId}: Marked as delivered (no devices to notify)`,
				)
				return
			}

			console.log(
				`📤 User ${userId}: Notifying ${enabledDevices.length} device(s)`,
			)

			let payload = createLocalizedNotificationPayload(
				userId,
				settings.language,
			)
			let anySuccess = false

			for (let device of enabledDevices) {
				let result = await sendNotificationToDevice(device, payload)

				result.match({
					ok: () => {
						console.log(
							`✅ User ${userId}: Sent to device ${device.endpoint.slice(-10)}`,
						)
						anySuccess = true
					},
					err: e => {
						console.error(
							`❌ User ${userId}: Failed device ${device.endpoint.slice(-10)}:`,
							e.message,
						)
						if (e.shouldRemove) {
							removeDeviceByEndpoint(settings, device.endpoint)
						}
					},
				})
			}

			if (anySuccess) {
				markAsDelivered(settings, currentUtc)
				console.log(`✅ User ${userId}: Completed notification delivery`)
				deliveryResults.push({ userId, success: true })
			} else {
				console.log(`❌ User ${userId}: All device sends failed, will retry`)
			}
		})()
			.catch((error: unknown) => {
				let message =
					typeof error === "string"
						? error
						: error instanceof Error
							? error.message
							: String(error)
				console.log(`❌ User ${ref.userId}: ${message}`)
			})
			.finally(() => {
				let index = processingPromises.indexOf(userPromise)
				if (index > -1) processingPromises.splice(index, 1)
			})

		processingPromises.push(userPromise)
	}

	await Promise.allSettled(processingPromises)

	for (let key of staleRefKeys) {
		refs.$jazz.delete(key)
	}

	if (staleRefKeys.length > 0) {
		console.log(`🗑️ Removed ${staleRefKeys.length} stale refs`)
	}

	let syncResult = await Result.tryPromise(() => worker.$jazz.waitForSync())
	syncResult.match({
		ok: () => {},
		err: e => console.error("❌ Failed to sync mutations:", e),
	})

	return {
		message: `Processed ${deliveryResults.length} notification deliveries`,
		results: deliveryResults,
	}
}
