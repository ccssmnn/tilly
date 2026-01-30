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
			resolve: { root: { notificationSettingsRefs: { $each: true } } },
		})

		if (root === undefined) {
			let newRoot = ServerAccountRoot.create(
				{ notificationSettingsRefs: [] },
				{ owner: account },
			)
			account.$jazz.set("root", newRoot)
		} else if (root.notificationSettingsRefs === undefined) {
			root.$jazz.set(
				"notificationSettingsRefs",
				co.list(NotificationSettingsRef).create([], { owner: account }),
			)
		}
	})
