import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { authMiddleware, requireAuth } from "../lib/auth-middleware"
import { initServerWorker } from "../lib/utils"
import { registerNotificationSettingsWithServer } from "./push-register-logic"

export { pushRegisterApp }

let pushRegisterApp = new Hono().post(
	"/register",
	authMiddleware,
	requireAuth,
	zValidator(
		"json",
		z.object({
			notificationSettingsId: z
				.string()
				.min(1)
				.refine(id => /^[a-zA-Z0-9_-]+$/.test(id), {
					message: "Invalid Jazz ID format",
				}),
		}),
	),
	async c => {
		let { notificationSettingsId } = c.req.valid("json")
		let user = c.get("user")

		let { worker } = await initServerWorker()

		let result = await registerNotificationSettingsWithServer(
			worker,
			notificationSettingsId,
			user.id,
		)

		if (!result.ok) {
			return c.json({ message: result.error }, result.status)
		}

		return c.json({ message: "Registered successfully" })
	},
)
