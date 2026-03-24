import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { errorToStatus } from "#server/lib/errors"
import { requireServerWorker, requireJazzAuth } from "../middleware/push-auth"
import { registerNotificationSettingsWithServer } from "../operations/register-settings"

export { pushRegisterApp }

let pushRegisterApp = new Hono()
	.use("*", requireServerWorker)
	.use("*", requireJazzAuth)
	.post(
		"/register",
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
			let serverWorker = c.get("serverWorker")
			let userId = c.get("userId")

			let result = await registerNotificationSettingsWithServer(
				serverWorker,
				notificationSettingsId,
				userId,
			)

			if (result.isErr()) {
				let e = result.error
				return c.json({ error: e.message, code: e._tag }, errorToStatus(e))
			}

			return c.json({ message: "Registered successfully" })
		},
	)
