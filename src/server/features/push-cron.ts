import { CRON_SECRET } from "astro:env/server"
import { initServerWorker } from "../lib/utils"

import { toZonedTime, format } from "date-fns-tz"
import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { co, type ResolveQuery } from "jazz-tools"
import {
	getEnabledDevices,
	sendNotificationToDevice,
	markNotificationSettingsAsDelivered,
	removeDeviceByEndpoint,
} from "./push-shared"
import type { NotificationPayload } from "./push-shared"
import { NotificationSettings } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"
import {
	baseServerMessages,
	deServerMessages,
} from "#shared/intl/messages.server"
import {
	isPastNotificationTime,
	wasDeliveredToday,
	isStaleRef,
} from "./push-cron-utils"

export { cronDeliveryApp }

let serverRefsQuery = {
	root: {
		notificationSettingsRefs: {
			$each: { notificationSettings: true },
		},
	},
} as const satisfies ResolveQuery<typeof ServerAccount>

type LoadedServerAccount = co.loaded<
	typeof ServerAccount,
	typeof serverRefsQuery
>
type LoadedRef = NonNullable<
	NonNullable<LoadedServerAccount["root"]["notificationSettingsRefs"]>[number]
>
type LoadedNotificationSettings = co.loaded<typeof NotificationSettings>

let cronDeliveryApp = new Hono().get(
	"/deliver-notifications",
	bearerAuth({ token: CRON_SECRET }),
	async c => {
		console.log("🔔 Starting notification delivery cron job")
		let deliveryResults: Array<{
			userId: string
			success: boolean
		}> = []
		let processingPromises: Promise<void>[] = []
		let maxConcurrentUsers = 50

		let { worker } = await initServerWorker()
		let serverAccount = await worker.$jazz.ensureLoaded({
			resolve: serverRefsQuery,
		})

		let refs = serverAccount.root.notificationSettingsRefs
		if (!refs) {
			console.log("🔔 No notification settings refs found")
			return c.json({
				message: "No notification settings refs found",
				results: [],
			})
		}

		let staleRefIndices: number[] = []
		let currentUtc = new Date()
		let refIndex = 0

		for (let ref of refs.values()) {
			if (!ref) {
				refIndex++
				continue
			}

			let notificationSettings = ref.notificationSettings
			if (!notificationSettings?.$isLoaded) {
				console.log(`❌ User ${ref.userId}: Settings not loaded`)
				refIndex++
				continue
			}

			// Check if ref is stale (no app open in 30 days after last sync or latest reminder)
			if (
				isStaleRef(ref.lastSyncedAt, notificationSettings.latestReminderDueDate)
			) {
				staleRefIndices.push(refIndex)
				console.log(`🗑️ Marking stale ref for removal: ${ref.userId}`)
				refIndex++
				continue
			}

			await waitForConcurrencyLimit(processingPromises, maxConcurrentUsers)

			let userPromise = processNotificationRef(
				ref,
				notificationSettings,
				currentUtc,
			)
				.then(result => {
					if (result) {
						deliveryResults.push(result)
					}
				})
				.catch(error => {
					if (typeof error === "string") {
						console.log(`❌ User ${ref.userId}: ${error}`)
					} else {
						console.log(`❌ User ${ref.userId}: ${error.message || error}`)
					}
				})
				.finally(() => removeFromList(processingPromises, userPromise))

			processingPromises.push(userPromise)
			refIndex++
		}

		await Promise.allSettled(processingPromises)

		// Remove stale refs (in reverse order to maintain indices)
		for (let i = staleRefIndices.length - 1; i >= 0; i--) {
			refs.$jazz.splice(staleRefIndices[i], 1)
		}

		if (staleRefIndices.length > 0) {
			console.log(`🗑️ Removed ${staleRefIndices.length} stale refs`)
		}

		// Single sync at end for all mutations
		await worker.$jazz.waitForSync()

		return c.json({
			message: `Processed ${deliveryResults.length} notification deliveries`,
			results: deliveryResults,
		})
	},
)

async function processNotificationRef(
	ref: LoadedRef,
	notificationSettings: LoadedNotificationSettings,
	currentUtc: Date,
): Promise<{ userId: string; success: boolean } | null> {
	let { userId } = ref

	// Check notification time
	if (!isPastNotificationTime(notificationSettings, currentUtc)) {
		let userTimezone = notificationSettings.timezone || "UTC"
		let userNotificationTime = notificationSettings.notificationTime || "12:00"
		let userLocalTime = toZonedTime(currentUtc, userTimezone)
		let userLocalTimeStr = format(userLocalTime, "HH:mm")
		throw `Not past notification time (current: ${userLocalTimeStr}, configured: ${userNotificationTime}, timezone: ${userTimezone})`
	}

	// Check if already delivered today
	if (wasDeliveredToday(notificationSettings, currentUtc)) {
		let userTimezone = notificationSettings.timezone || "UTC"
		let lastDelivered = notificationSettings.lastDeliveredAt
			? format(
					toZonedTime(notificationSettings.lastDeliveredAt, userTimezone),
					"yyyy-MM-dd HH:mm",
				)
			: "never"
		throw `Already delivered today (last delivered: ${lastDelivered})`
	}

	console.log(`✅ User ${userId}: Passed notification time checks`)

	// Get enabled devices
	let enabledDevices = getEnabledDevices(notificationSettings)
	if (enabledDevices.length === 0) {
		console.log(`✅ User ${userId}: No enabled devices`)
		markNotificationSettingsAsDelivered(notificationSettings, currentUtc)
		console.log(
			`✅ User ${userId}: Marked as delivered (skipped - no action needed)`,
		)
		return { userId, success: true }
	}

	console.log(
		`✅ User ${userId}: Ready to send wake notification to ${enabledDevices.length} devices`,
	)

	// Create localized payload
	let payload = createLocalizedNotificationPayload(userId, notificationSettings)

	// Send to all devices
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

	markNotificationSettingsAsDelivered(notificationSettings, currentUtc)

	console.log(`✅ User ${userId}: Completed notification delivery`)

	return { userId, success: userSuccess }
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

// Create localized notification payload with {count} placeholder for SW interpolation
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
