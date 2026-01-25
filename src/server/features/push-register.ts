import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { co, type ID } from "jazz-tools"
import { authMiddleware, requireAuth } from "../lib/auth-middleware"
import { initServerWorker } from "../lib/utils"
import { NotificationSettings } from "#shared/schema/user"
import { NotificationSettingsRef } from "#shared/schema/server"

export { pushRegisterApp }

let pushRegisterApp = new Hono().post(
	"/register",
	authMiddleware,
	requireAuth,
	zValidator("json", z.object({ notificationSettingsId: z.string() })),
	async c => {
		let { notificationSettingsId } = c.req.valid("json")
		let user = c.get("user")

		let { worker } = await initServerWorker()

		// Load the notification settings by ID (server must already be a writer on the group)
		let notificationSettings = await NotificationSettings.load(
			notificationSettingsId as ID<typeof NotificationSettings>,
			{ loadAs: worker },
		)

		if (!notificationSettings || !notificationSettings.$isLoaded) {
			return c.json(
				{
					message:
						"Failed to load notification settings - ensure server has access",
				},
				400,
			)
		}

		// Ensure server root has the refs list
		if (!worker.root) {
			return c.json({ message: "Server root not initialized" }, 500)
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

		// Check if ref already exists
		let existingRef = refs
			.values()
			.find(
				ref => ref?.notificationSettings?.$jazz.id === notificationSettingsId,
			)

		if (existingRef) {
			// Update lastSyncedAt
			existingRef.$jazz.set("lastSyncedAt", new Date())
		} else {
			// Add new ref
			let newRef = NotificationSettingsRef.create({
				notificationSettings,
				userId: user.id,
				lastSyncedAt: new Date(),
			})
			refs.$jazz.push(newRef)
		}

		await worker.$jazz.waitForSync()

		return c.json({ message: "Registered successfully" })
	},
)
