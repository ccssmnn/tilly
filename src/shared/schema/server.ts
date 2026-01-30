import { co, z } from "jazz-tools"
import { NotificationSettings } from "./user"

export let NotificationSettingsRef = co.map({
	notificationSettings: NotificationSettings,
	userId: z.string(),
	lastSyncedAt: z.date(),
})

export let ServerAccountRoot = co.map({
	notificationSettingsRefs: co.list(NotificationSettingsRef).optional(),
})

export let ServerAccount = co
	.account({
		profile: co.map({ name: z.string() }),
		root: ServerAccountRoot,
	})
	.withMigration(async account => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: true },
		})

		if (root === undefined) {
			let newRoot = ServerAccountRoot.create(
				{ notificationSettingsRefs: [] },
				{ owner: account },
			)
			account.$jazz.set("root", newRoot)
		} else if (root.notificationSettingsRefs === undefined) {
			let updatedRoot = ServerAccountRoot.create(
				{ notificationSettingsRefs: [] },
				{ owner: account },
			)
			account.$jazz.set("root", updatedRoot)
		}
	})
