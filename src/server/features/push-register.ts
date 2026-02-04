import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { authenticateRequest } from "jazz-tools"
import { getServerWorker, WorkerTimeoutError } from "../lib/utils"
import { registerNotificationSettingsWithServer } from "./push-register-logic"

export { pushRegisterApp }

let pushRegisterApp = new Hono().post(
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

		let worker
		try {
			worker = await getServerWorker()
		} catch (error) {
			if (error instanceof WorkerTimeoutError) {
				return c.json({ error: error.message, code: "worker-timeout" }, 504)
			}
			throw error
		}

		let { account, error } = await authenticateRequest(c.req.raw, {
			loadAs: worker,
		})

		if (error) {
			return c.json({ message: error.message }, 401)
		}

		if (!account) {
			return c.json({ message: "Authentication required" }, 401)
		}

		let userId = account.$jazz.id

		let result = await registerNotificationSettingsWithServer(
			worker,
			notificationSettingsId,
			userId,
		)

		if (!result.ok) {
			return c.json({ message: result.error }, result.status)
		}

		return c.json({ message: "Registered successfully" })
	},
)
