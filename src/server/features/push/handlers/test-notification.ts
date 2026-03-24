import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { errorToStatus } from "#server/lib/errors"
import {
	requireServerWorker,
	requireJazzAuth,
} from "../middleware/push-auth"
import { sendTestNotification } from "../operations/send-test-notification"

export { testNotificationApp }

let testNotificationApp = new Hono()
	.use("*", requireServerWorker)
	.use("*", requireJazzAuth)
	.post(
		"/send-test-notification",
		zValidator("json", z.object({ endpoint: z.string() })),
		async c => {
			let serverWorker = c.get("serverWorker")
			let userId = c.get("userId")
			let { endpoint } = c.req.valid("json")

			let result = await sendTestNotification(
				serverWorker,
				userId,
				endpoint,
			)

			if (result.isErr()) {
				let e = result.error
				return c.json({ error: e.message, code: e._tag }, errorToStatus(e))
			}

			return c.json({ message: "Test notification sent" })
		},
	)
