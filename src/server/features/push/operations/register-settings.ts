import { Result } from "better-result"
import { co, type ID } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import {
	NotificationSettingsRef,
	NotificationSettingsRefsRecord,
	ServerAccount,
} from "#shared/schema/server"
import { NotFound, ServerError, SyncFailed } from "#server/lib/errors"

export { registerNotificationSettingsWithServer }
export type { RegisterError }

type RegisterError = NotFound | ServerError | SyncFailed

async function registerNotificationSettingsWithServer(
	worker: co.loaded<typeof ServerAccount>,
	notificationSettingsId: string,
	userId: string,
): Promise<Result<void, RegisterError>> {
	return Result.gen(async function* () {
		let notificationSettings = await NotificationSettings.load(
			notificationSettingsId as ID<typeof NotificationSettings>,
			{ loadAs: worker },
		)

		if (!notificationSettings || !notificationSettings.$isLoaded) {
			return Result.err(
				new NotFound({
					message:
						"Failed to load notification settings - ensure server has access",
				}),
			)
		}

		if (!worker.root) {
			return Result.err(
				new ServerError({ message: "Server root not initialized" }),
			)
		}

		let root = await worker.$jazz.ensureLoaded({
			resolve: { root: { notificationSettingsRefsV2: true } },
		})

		if (!root.root.notificationSettingsRefsV2) {
			root.root.$jazz.set(
				"notificationSettingsRefsV2",
				NotificationSettingsRefsRecord.create({}, root.root.$jazz.owner),
			)
		}

		let refsV2 = root.root.notificationSettingsRefsV2!
		let newRef = NotificationSettingsRef.create(
			{
				notificationSettings,
				userId,
				lastSyncedAt: new Date(),
			},
			refsV2.$jazz.owner,
		)
		refsV2.$jazz.set(notificationSettingsId, newRef)

		yield* Result.await(
			Result.tryPromise({
				try: () => worker.$jazz.waitForSync(),
				catch: e => {
					console.error("Failed to sync registration:", e)
					return new SyncFailed({
						message: "Failed to sync registration",
					})
				},
			}),
		)

		return Result.ok(undefined)
	})
}
