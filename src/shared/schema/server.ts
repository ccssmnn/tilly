import { co, z } from "jazz-tools"
import { NotificationSettings } from "./user"

export let NotificationSettingsRef = co.map({
	notificationSettings: NotificationSettings,
	userId: z.string(),
	lastSyncedAt: z.date(),
})

export let NotificationSettingsRefsRecord = co.record(
	z.string(),
	NotificationSettingsRef,
)

export let ServerAccountRoot = co.map({
	notificationSettingsRefs: co.list(NotificationSettingsRef).optional(),
	notificationSettingsRefsV2: NotificationSettingsRefsRecord.optional(),
})

export let ServerAccount = co
	.account({
		profile: co.map({ name: z.string() }),
		root: ServerAccountRoot,
	})
	.withMigration(async account => {
		if (!account.$jazz.has("root")) {
			let newRoot = ServerAccountRoot.create(
				{
					notificationSettingsRefs: co.list(NotificationSettingsRef).create([]),
					notificationSettingsRefsV2: NotificationSettingsRefsRecord.create({}),
				},
				account.$jazz.owner,
			)
			account.$jazz.set("root", newRoot)
		} else {
			let { root } = await account.$jazz.ensureLoaded({
				resolve: { root: true },
			})
			if (root.notificationSettingsRefs === undefined) {
				root.$jazz.set(
					"notificationSettingsRefs",
					co.list(NotificationSettingsRef).create([], root.$jazz.owner),
				)
			}

			if (root.notificationSettingsRefsV2 === undefined) {
				root.$jazz.set(
					"notificationSettingsRefsV2",
					NotificationSettingsRefsRecord.create({}, root.$jazz.owner),
				)
			}
		}
	})
