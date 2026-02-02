import { co, type ID } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import { NotificationSettingsRef, ServerAccount } from "#shared/schema/server"
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
		resolve: { root: { notificationSettingsRefs: { $each: true } } },
	})

	if (!root.root.notificationSettingsRefs) {
		root.root.$jazz.set(
			"notificationSettingsRefs",
			co.list(NotificationSettingsRef).create([]),
		)
	}

	let refs = root.root.notificationSettingsRefs!

	let existingRef = Array.from(refs.values()).find(
		ref => ref?.notificationSettings?.$jazz.id === notificationSettingsId,
	)

	if (existingRef) {
		existingRef.$jazz.set("lastSyncedAt", new Date())
	} else {
		let newRef = NotificationSettingsRef.create({
			notificationSettings,
			userId,
			lastSyncedAt: new Date(),
		})
		refs.$jazz.push(newRef)
	}

	let syncResult = await tryCatch(worker.$jazz.waitForSync())
	if (!syncResult.ok) {
		console.error("Failed to sync registration:", syncResult.error)
		return { ok: false, error: "Failed to sync registration", status: 500 }
	}

	return { ok: true }
}
