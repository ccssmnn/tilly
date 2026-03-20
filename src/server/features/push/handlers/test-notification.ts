import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { authenticateRequest } from "jazz-tools"
import { getServerWorker, WorkerTimeoutError } from "#server/lib/utils"
import { errorToStatus } from "#server/lib/errors"
import { sendTestNotification } from "../operations/send-test-notification"

export { testNotificationApp }

let testNotificationApp = new Hono().post(
	"/send-test-notification",
	zValidator("json", z.object({ endpoint: z.string() })),
	async c => {
		let { endpoint } = c.req.valid("json")

		let serverWorker
		try {
			serverWorker = await getServerWorker()
		} catch (error) {
			if (error instanceof WorkerTimeoutError) {
				return c.json({ error: error.message, code: "worker-timeout" }, 504)
			}
			throw error
		}

		let { account, error } = await authenticateRequest(c.req.raw, {
			loadAs: serverWorker,
		})

		if (error || !account) {
			return c.json({ error: "Authentication required" }, 401)
		}

		let userId = account.$jazz.id

		let result = await sendTestNotification(serverWorker, userId, endpoint)

		return result.match({
			ok: () => c.json({ message: "success" }),
			err: e => c.json({ message: e.message }, errorToStatus(e)),
		})
	},
)
