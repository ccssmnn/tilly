import { Result } from "better-result"
import type { co } from "jazz-tools"
import type { ServerAccount } from "#shared/schema/server"
import type { NotFound, SendFailed } from "#server/lib/errors"
import { loadServerRefs, findUserRef } from "../lib/load-server-refs"
import { findDeviceByEndpoint } from "../lib/device-management"
import { sendNotificationToDevice } from "../lib/send-notification"
import { createTestPayload } from "../lib/localization"

export { sendTestNotification }
export type { SendTestError }

type SendTestError = NotFound | SendFailed

async function sendTestNotification(
	serverWorker: co.loaded<typeof ServerAccount>,
	userId: string,
	endpoint: string,
): Promise<Result<void, SendTestError>> {
	return Result.gen(async function* () {
		let refs = yield* loadServerRefs(serverWorker)
		let { notificationSettings } = yield* findUserRef(refs, userId)
		let device = yield* findDeviceByEndpoint(notificationSettings, endpoint)
		let payload = createTestPayload(notificationSettings.language, userId)
		yield* Result.await(sendNotificationToDevice(device, payload))
		return Result.ok(undefined)
	})
}
