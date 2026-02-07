import { co, type ID } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import {
	NotificationSettingsRef,
	NotificationSettingsRefsRecord,
	ServerAccount,
} from "#shared/schema/server"
import { tryCatch } from "#shared/lib/trycatch"

export { registerNotificationSettingsWithServer }
export type { RegisterResult }

type RegisterResult =
	| { ok: true }
	| { ok: false; error: string; status: 400 | 500 }

async function registerNotificationSettingsWithServer(
	worker: co.loaded<typeof ServerAccount>,
	notificationSettingsId: string,
	userId: string,
): Promise<RegisterResult> {
	let notificationSettings = await NotificationSettings.load(
		notificationSettingsId as ID<typeof NotificationSettings>,
		{ loadAs: worker },
	)

	if (!notificationSettings || !notificationSettings.$isLoaded) {
		return {
			ok: false,
			error: "Failed to load notification settings - ensure server has access",
			status: 400,
		}
	}

	if (!worker.root) {
		return { ok: false, error: "Server root not initialized", status: 500 }
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

	let syncResult = await tryCatch(worker.$jazz.waitForSync())
	if (!syncResult.ok) {
		console.error("Failed to sync registration:", syncResult.error)
		return { ok: false, error: "Failed to sync registration", status: 500 }
	}

	return { ok: true }
}
