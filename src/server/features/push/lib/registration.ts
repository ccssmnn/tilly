import { Result } from "better-result"
import { co, type ID } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import {
	NotificationSettingsRef,
	NotificationSettingsRefsRecord,
	ServerAccount,
} from "#shared/schema/server"
import { NotFound, ServerError } from "#server/lib/errors"

export { loadNotificationSettings, ensureRefsRecord, addRef }

function loadNotificationSettings(
	worker: co.loaded<typeof ServerAccount>,
	notificationSettingsId: string,
) {
	return Result.await(
		Result.tryPromise({
			try: async () => {
				let settings = await NotificationSettings.load(
					notificationSettingsId as ID<typeof NotificationSettings>,
					{ loadAs: worker },
				)
				if (!settings?.$isLoaded) {
					throw new NotFound({
						message:
							"Failed to load notification settings - ensure server has access",
					})
				}
				return settings
			},
			catch: error => {
				if (error instanceof NotFound) return error
				throw error
			},
		}),
	)
}

function ensureRefsRecord(worker: co.loaded<typeof ServerAccount>) {
	return Result.await(
		Result.tryPromise({
			try: async () => {
				let loaded = await worker.$jazz.ensureLoaded({
					resolve: { root: { notificationSettingsRefsV2: true } },
				})
				if (!loaded.root.notificationSettingsRefsV2) {
					loaded.root.$jazz.set(
						"notificationSettingsRefsV2",
						NotificationSettingsRefsRecord.create({}, loaded.root.$jazz.owner),
					)
				}
				let reloaded = await worker.$jazz.ensureLoaded({
					resolve: { root: { notificationSettingsRefsV2: true } },
				})
				let refs = reloaded.root.notificationSettingsRefsV2
				if (!refs) {
					throw new ServerError({
						message: "Failed to create refs record",
					})
				}
				return refs
			},
			catch: error => {
				if (error instanceof ServerError) return error
				throw error
			},
		}),
	)
}

type RefsRecord = co.loaded<typeof NotificationSettingsRefsRecord>

function addRef(
	refs: RefsRecord,
	notificationSettingsId: string,
	notificationSettings: co.loaded<typeof NotificationSettings>,
	userId: string,
) {
	let newRef = NotificationSettingsRef.create(
		{
			notificationSettings,
			userId,
			lastSyncedAt: new Date(),
		},
		refs.$jazz.owner,
	)
	refs.$jazz.set(notificationSettingsId, newRef)
}
