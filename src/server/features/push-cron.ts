import { CRON_SECRET, CLERK_SECRET_KEY } from "astro:env/server"
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "astro:env/client"
import { createClerkClient } from "@clerk/backend"
import type { User } from "@clerk/backend"
import { initUserWorker } from "../lib/utils"
import { tryCatch } from "#shared/lib/trycatch"
import { toZonedTime, format } from "date-fns-tz"
import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import {
	getEnabledDevices,
	sendNotificationToDevice,
	markNotificationSettingsAsDelivered,
	removeDeviceByEndpoint,
	settingsQuery,
	getLocalizedMessages,
} from "./push-shared"
import type {
	PushDevice,
	NotificationPayload,
	LoadedNotificationSettings,
	LoadedUserAccountSettings,
} from "./push-shared"

export { cronDeliveryApp }

let cronDeliveryApp = new Hono().get(
	"/deliver-notifications",
	bearerAuth({ token: CRON_SECRET }),
	async c => {
		console.log("🔔 Starting notification delivery cron job")
		let deliveryResults: Array<{
			userID: string
			success: boolean
		}> = []
		let processingPromises: Promise<void>[] = []
		let maxConcurrentUsers = 50

		for await (let user of userGenerator()) {
			await waitForConcurrencyLimit(processingPromises, maxConcurrentUsers)

			let userPromise = loadNotificationSettings(user)
				.then(data => shouldReceiveNotification(data))
				.then(data => getDevices(data))
				.then(userWithDevices => processDevicesPipeline(userWithDevices))
				.then(results => {
					deliveryResults.push(...results)
				})
				.catch(error => {
					if (typeof error === "string") {
						console.log(`❌ User ${user.id}: ${error}`)
					} else {
						console.log(`❌ User ${user.id}: ${error.message || error}`)
					}
				})
				.finally(() => removeFromList(processingPromises, userPromise))

			processingPromises.push(userPromise)
		}

		await Promise.allSettled(processingPromises)

		return c.json({
			message: `Processed ${deliveryResults.length} notification deliveries`,
			results: deliveryResults,
		})
	},
)

async function* userGenerator() {
	let clerkClient = createClerkClient({
		secretKey: CLERK_SECRET_KEY,
		publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY,
	})

	let offset = 0
	let limit = 500
	let totalUsers = 0
	let jazzUsers = 0

	while (true) {
		let response = await clerkClient.users.getUserList({
			limit,
			offset,
		})

		totalUsers += response.data.length

		for (let user of response.data) {
			if (
				user.unsafeMetadata.jazzAccountID &&
				user.unsafeMetadata.jazzAccountSecret
			) {
				jazzUsers++
				yield user
			}
		}

		if (response.data.length < limit) {
			break
		}

		offset += limit
	}

	console.log(
		`🚀 Found ${jazzUsers} users with Jazz accounts out of ${totalUsers} total users`,
	)
}

async function loadNotificationSettings(user: User) {
	let workerResult = await tryCatch(initUserWorker(user))
	if (!workerResult.ok) {
		throw `Failed to init worker - ${workerResult.error}`
	}

	let workerWithSettings = await workerResult.data.worker.$jazz.ensureLoaded({
		resolve: settingsQuery,
	})
	let notificationSettings = workerWithSettings.root.notificationSettings
	if (!notificationSettings) {
		throw "No notification settings configured"
	}

	console.log(`✅ User ${user.id}: Loaded notification settings`)

	return {
		user,
		notificationSettings,
		worker: workerWithSettings,
		currentUtc: new Date(),
	}
}

async function shouldReceiveNotification<
	T extends {
		notificationSettings: LoadedNotificationSettings
		currentUtc: Date
		user: User
	},
>(data: T) {
	let { notificationSettings, currentUtc, user } = data

	if (!isPastNotificationTime(notificationSettings, currentUtc)) {
		let userTimezone = notificationSettings.timezone || "UTC"
		let userNotificationTime = notificationSettings.notificationTime || "12:00"
		let userLocalTime = toZonedTime(currentUtc, userTimezone)
		let userLocalTimeStr = format(userLocalTime, "HH:mm")
		throw `Not past notification time (current: ${userLocalTimeStr}, configured: ${userNotificationTime}, timezone: ${userTimezone})`
	}

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

	console.log(`✅ User ${user.id}: Passed notification time checks`)

	return data
}

async function getDevices(
	data: NotificationProcessingContext,
): Promise<DeviceNotificationContext> {
	let { user, notificationSettings } = data

	let enabledDevices = getEnabledDevices(notificationSettings)
	if (enabledDevices.length === 0) {
		console.log(`✅ User ${user.id}: No enabled devices`)
		return {
			...data,
			devices: [],
		}
	}

	console.log(
		`✅ User ${user.id}: Ready to send wake notification to ${enabledDevices.length} devices`,
	)

	return {
		...data,
		devices: enabledDevices,
	}
}

async function processDevicesPipeline(
	userWithDevices: DeviceNotificationContext,
) {
	let { user, devices, notificationSettings, worker, currentUtc } =
		userWithDevices

	if (devices.length === 0) {
		markNotificationSettingsAsDelivered(notificationSettings, currentUtc)
		await worker.$jazz.waitForSync()
		console.log(
			`✅ User ${user.id}: Marked as delivered (skipped - no action needed)`,
		)
		return [{ userID: user.id, success: true }]
	}

	let payload = createLocalizedNotificationPayload(user.id, worker)

	let deviceResults: { success: boolean }[] = []

	for (let device of devices) {
		let result = await sendNotificationToDevice(device, payload)

		if (result.ok) {
			console.log(
				`✅ User ${user.id}: Successfully sent to device ${device.endpoint.slice(-10)}`,
			)
			deviceResults.push({ success: true })
		} else {
			console.error(
				`❌ User ${user.id}: Failed to send to device ${device.endpoint.slice(-10)}:`,
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
	await worker.$jazz.waitForSync()

	console.log(`✅ User ${user.id}: Completed notification delivery`)

	return [{ userID: user.id, success: userSuccess }]
}

import { isPastNotificationTime, wasDeliveredToday } from "./push-cron-utils"

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
// Note: We access raw message strings directly (not via t()) to preserve {count} placeholder
function createLocalizedNotificationPayload(
	userId: string,
	worker: LoadedUserAccountSettings,
): NotificationPayload {
	let messages = getLocalizedMessages(worker)
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

type NotificationProcessingContext = {
	user: User
	notificationSettings: LoadedNotificationSettings
	worker: LoadedUserAccountSettings
	currentUtc: Date
}

type DeviceNotificationContext = NotificationProcessingContext & {
	devices: PushDevice[]
}
