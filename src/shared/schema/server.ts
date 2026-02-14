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

function isRootAuthCorruptionError(error: unknown) {
	if (!(error instanceof Error)) return false
	let message = error.message || ""
	return message.includes("Failed to deeply load CoValue")
}

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
					notificationSettingsRefs: co
						.list(NotificationSettingsRef)
						.create([], account),
					notificationSettingsRefsV2: NotificationSettingsRefsRecord.create(
						{},
						account,
					),
				},
				account,
			)
			account.$jazz.set("root", newRoot)
		} else {
			let loaded
			try {
				loaded = await account.$jazz.ensureLoaded({
					resolve: { root: true },
				})
			} catch (error) {
				let currentRoot = Reflect.get(account, "root")
				console.error("[ServerAccount] Failed to load root", {
					accountId: account.$jazz.id,
					rootValueType: typeof currentRoot,
					rootId:
						currentRoot &&
						typeof currentRoot === "object" &&
						"$jazz" in currentRoot
							? Reflect.get(Reflect.get(currentRoot, "$jazz"), "id")
							: undefined,
					error:
						error instanceof Error
							? {
									name: error.name,
									message: error.message,
									stack: error.stack,
								}
							: String(error),
				})

				if (isRootAuthCorruptionError(error)) {
					let repairedRoot = ServerAccountRoot.create(
						{
							notificationSettingsRefs: co
								.list(NotificationSettingsRef)
								.create([], account),
							notificationSettingsRefsV2: NotificationSettingsRefsRecord.create(
								{},
								account,
							),
						},
						account,
					)
					account.$jazz.set("root", repairedRoot)
					console.warn("[ServerAccount] Repaired unreadable root", {
						accountId: account.$jazz.id,
						oldRootId:
							currentRoot &&
							typeof currentRoot === "object" &&
							"$jazz" in currentRoot
								? Reflect.get(Reflect.get(currentRoot, "$jazz"), "id")
								: undefined,
						newRootId: repairedRoot.$jazz.id,
					})
					return
				}

				throw error
			}

			let { root } = loaded
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
