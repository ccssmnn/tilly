import { Result } from "better-result"
import type { co } from "jazz-tools"
import type { ServerAccount } from "#shared/schema/server"
import type { NotFound, ServerError, SyncFailed } from "#server/lib/errors"
import {
	loadNotificationSettings,
	ensureRefsRecord,
	addRef,
} from "../lib/registration"
import { syncWorker } from "../lib/sync-worker"

export { registerNotificationSettingsWithServer }
export type { RegisterError }

type RegisterError = NotFound | ServerError | SyncFailed

async function registerNotificationSettingsWithServer(
	worker: co.loaded<typeof ServerAccount>,
	notificationSettingsId: string,
	userId: string,
): Promise<Result<void, RegisterError>> {
	return Result.gen(async function* () {
		let notificationSettings = yield* loadNotificationSettings(
			worker,
			notificationSettingsId,
		)
		let refs = yield* ensureRefsRecord(worker)
		addRef(refs, notificationSettingsId, notificationSettings, userId)
		yield* syncWorker(worker)
		return Result.ok(undefined)
	})
}
