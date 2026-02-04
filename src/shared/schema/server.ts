import { co, z } from "jazz-tools"
import { NotificationSettings } from "./user"

export let NotificationSettingsRef = co.map({
	notificationSettings: NotificationSettings,
	userId: z.string(),
	lastSyncedAt: z.date(),
})

// Keyed by notificationSettingsId for idempotent upserts (prevents duplicates under concurrent requests)
export let NotificationSettingsRefsRecord = co.record(
	z.string(),
	NotificationSettingsRef,
)

export let ServerAccountRoot = co.map({
	notificationSettingsRefs: NotificationSettingsRefsRecord.optional(),
})

export let ServerAccount = co
	.account({
		profile: co.map({ name: z.string() }),
		root: ServerAccountRoot,
	})
	.withMigration(async account => {
		if (!account.$jazz.has("root")) {
			let newRoot = ServerAccountRoot.create({
				notificationSettingsRefs: NotificationSettingsRefsRecord.create({}),
			})
			account.$jazz.set("root", newRoot)
		} else {
			let { root } = await account.$jazz.ensureLoaded({
				resolve: { root: { notificationSettingsRefs: { $each: true } } },
			})
			if (root.notificationSettingsRefs === undefined) {
				root.$jazz.set(
					"notificationSettingsRefs",
					NotificationSettingsRefsRecord.create({}),
				)
			}
		}
	})
