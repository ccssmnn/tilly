import { toZonedTime, format } from "date-fns-tz"
import { co, type ResolveQuery } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import { ServerAccount, NotificationSettingsRef } from "#shared/schema/server"
import {
	baseServerMessages,
	deServerMessages,
} from "#shared/intl/messages.server"
import { tryCatch } from "#shared/lib/trycatch"
import {
	getEnabledDevices,
	removeDeviceByEndpoint,
	markAsDelivered,
} from "../lib/device-management"
import { sendNotificationToDevice } from "../lib/send-notification"
import type { NotificationPayload } from "../lib/send-notification"
import { isPastNotificationTime, wasDeliveredToday } from "../lib/notification-time"
import { isStaleRef } from "../lib/stale-ref"

export { deliverNotifications }
export type { DeliveryResult }

let serverRefsQuery = {
	root: {
		notificationSettingsRefsV2: {
			$each: { notificationSettings: true },
		},
	},
} as const satisfies ResolveQuery<typeof ServerAccount>

type LoadedRef = co.loaded<typeof NotificationSettingsRef>
type LoadedNotificationSettings = co.loaded<typeof NotificationSettings>

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

		await waitForConcurrencyLimit(processingPromises, maxConcurrentUsers)

		let userPromise = processNotificationRef(
			ref,
			notificationSettings,
			currentUtc,
		)
			.then(result => {
				if (result.status === "processed") {
					deliveryResults.push(result)
				}
			})
			.catch(error => {
				let message =
					typeof error === "string"
						? error
						: error instanceof Error
							? error.message
							: String(error)
				console.log(`❌ User ${ref.userId}: ${message}`)
			})
			.finally(() => removeFromList(processingPromises, userPromise))

		processingPromises.push(userPromise)
	}

	await Promise.allSettled(processingPromises)

	for (let key of staleRefKeys) {
		refs.$jazz.delete(key)
	}

	if (staleRefKeys.length > 0) {
		console.log(`🗑️ Removed ${staleRefKeys.length} stale refs`)
	}

	let syncResult = await tryCatch(worker.$jazz.waitForSync())
	if (!syncResult.ok) {
		console.error("❌ Failed to sync mutations:", syncResult.error)
	}

	return {
		message: `Processed ${deliveryResults.length} notification deliveries`,
		results: deliveryResults,
	}
}

type ProcessResult =
	| { status: "skipped"; reason: string }
	| { status: "processed"; userId: string; success: boolean }
	| { status: "failed"; userId: string; reason: string }

async function processNotificationRef(
	ref: LoadedRef,
	notificationSettings: LoadedNotificationSettings,
	currentUtc: Date,
): Promise<ProcessResult> {
	let { userId } = ref

	if (!isPastNotificationTime(notificationSettings, currentUtc)) {
		let userTimezone = notificationSettings.timezone || "UTC"
		let userNotificationTime = notificationSettings.notificationTime || "12:00"
		let userLocalTime = toZonedTime(currentUtc, userTimezone)
		let userLocalTimeStr = format(userLocalTime, "HH:mm")
		return {
			status: "skipped",
			reason: `Not past notification time (current: ${userLocalTimeStr}, configured: ${userNotificationTime}, timezone: ${userTimezone})`,
		}
	}

	if (wasDeliveredToday(notificationSettings, currentUtc)) {
		let userTimezone = notificationSettings.timezone || "UTC"
		let lastDelivered = notificationSettings.lastDeliveredAt
			? format(
					toZonedTime(notificationSettings.lastDeliveredAt, userTimezone),
					"yyyy-MM-dd HH:mm",
				)
			: "never"
		return {
			status: "skipped",
			reason: `Already delivered today (last delivered: ${lastDelivered})`,
		}
	}

	console.log(`✅ User ${userId}: Passed notification time checks`)

	let enabledDevices = getEnabledDevices(notificationSettings)
	if (enabledDevices.length === 0) {
		console.log(`✅ User ${userId}: No enabled devices`)
		markAsDelivered(notificationSettings, currentUtc)
		console.log(`✅ User ${userId}: Marked as delivered (no devices to notify)`)
		return { status: "skipped", reason: "No enabled devices" }
	}

	console.log(`📤 User ${userId}: Notifying ${enabledDevices.length} device(s)`)

	let payload = createLocalizedNotificationPayload(userId, notificationSettings)

	let deviceResults: { success: boolean }[] = []

	for (let device of enabledDevices) {
		let result = await sendNotificationToDevice(device, payload)

		if (result.ok) {
			console.log(
				`✅ User ${userId}: Successfully sent to device ${device.endpoint.slice(-10)}`,
			)
			deviceResults.push({ success: true })
		} else {
			console.error(
				`❌ User ${userId}: Failed to send to device ${device.endpoint.slice(-10)}:`,
				result.error,
			)

			if (result.shouldRemove) {
				removeDeviceByEndpoint(notificationSettings, device.endpoint)
			}

			deviceResults.push({ success: false })
		}
	}

	let userSuccess = deviceResults.some(r => r.success)

	if (userSuccess) {
		markAsDelivered(notificationSettings, currentUtc)
		console.log(`✅ User ${userId}: Completed notification delivery`)
		return { status: "processed", userId, success: true }
	} else {
		console.log(`❌ User ${userId}: All device sends failed, will retry`)
		return { status: "failed", userId, reason: "All device sends failed" }
	}
}

async function waitForConcurrencyLimit(
	promises: Promise<void>[],
	maxConcurrency: number,
) {
	if (promises.length >= maxConcurrency) {
		await Promise.race(promises)
	}
}

function removeFromList<T>(list: T[], item: T) {
	let index = list.indexOf(item)
	if (index > -1) list.splice(index, 1)
}

function createLocalizedNotificationPayload(
	userId: string,
	notificationSettings: LoadedNotificationSettings,
): NotificationPayload {
	let language = notificationSettings.language || "en"
	let messages = language === "de" ? deServerMessages : baseServerMessages
	return {
		titleOne: messages["server.push.dueReminders.titleOne"],
		titleMany: messages["server.push.dueReminders.titleMany"],
		body: messages["server.push.dueReminders.body"],
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		url: "/app/reminders",
		userId,
	}
}
