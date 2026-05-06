import { CRON_SECRET } from "astro:env/server"
import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { errorToStatus } from "#server/lib/errors"
import { requireServerWorker } from "../middleware/push-auth"
import { deliverNotifications } from "../operations/deliver-notifications"

export { cronDeliveryApp }

let cronDeliveryApp = new Hono()
	.use("*", requireServerWorker)
	.get(
		"/deliver-notifications",
		bearerAuth({ token: CRON_SECRET }),
		async c => {
			let worker = c.get("serverWorker")
			let result = await deliverNotifications(worker)

			if (result.isErr()) {
				let e = result.error
				return c.json({ error: e.message, code: e._tag }, errorToStatus(e))
			}

			return c.json(result.value)
		},
	)
