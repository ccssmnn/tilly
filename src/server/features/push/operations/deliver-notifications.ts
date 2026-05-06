import { Result } from "better-result"
import type { co } from "jazz-tools"
import type { ServerAccount } from "#shared/schema/server"
import type { NotFound, ServerError, SyncFailed } from "#server/lib/errors"
import { loadServerRefs, type LoadedRef } from "../lib/load-server-refs"
import { syncWorker } from "../lib/sync-worker"
import { processAllUsers, removeStaleRefs } from "../lib/delivery"
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

export { deliverNotifications, deliverToUser }
export type { DeliveryResult, DeliveryError }

type DeliveryResult = {
	message: string
	results: Array<{ userId: string; success: boolean }>
}

type DeliveryError = NotFound | ServerError | SyncFailed

async function deliverNotifications(
	worker: co.loaded<typeof ServerAccount>,
): Promise<Result<DeliveryResult, DeliveryError>> {
	return Result.gen(async function* () {
		let refs = yield* loadServerRefs(worker)
		let { results, staleRefKeys } = yield* processAllUsers(
			refs,
			ref =>
				isStaleRef(
					ref.lastSyncedAt,
					ref.notificationSettings?.latestReminderDueDate,
				),
			deliverToUser,
		)
		removeStaleRefs(refs, staleRefKeys)
		yield* syncWorker(worker)
		return Result.ok({
			message: `Processed ${results.length} notification deliveries`,
			results,
		})
	})
}

async function deliverToUser(
	ref: LoadedRef,
	currentUtc: Date,
): Promise<{ userId: string; success: boolean } | undefined> {
	let { userId } = ref
	let settings = ref.notificationSettings

	if (!isPastNotificationTime(settings, currentUtc)) return undefined
	if (wasDeliveredToday(settings, currentUtc)) return undefined

	let enabledDevices = getEnabledDevices(settings)
	if (enabledDevices.length === 0) {
		markAsDelivered(settings, currentUtc)
		return undefined
	}

	let payload = createLocalizedNotificationPayload(userId, settings.language)
	let anySuccess = false

	for (let device of enabledDevices) {
		let result = await sendNotificationToDevice(device, payload)
		result.match({
			ok: () => {
				anySuccess = true
			},
			err: e => {
				console.error(
					`[Push] ${userId}: Failed device ${device.endpoint.slice(-10)}: ${e.message}`,
				)
				if (e.shouldRemove) {
					removeDeviceByEndpoint(settings, device.endpoint)
				}
			},
		})
	}

	if (anySuccess) {
		markAsDelivered(settings, currentUtc)
		return { userId, success: true }
	}

	return undefined
}
