import { CRON_SECRET } from "astro:env/server"
import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { requireServerWorker } from "../middleware/push-auth"
import { deliverNotifications } from "../operations/deliver-notifications"

export { cronDeliveryApp }

let cronDeliveryApp = new Hono()
	.use("*", requireServerWorker)
	.get(
		"/deliver-notifications",
		bearerAuth({ token: CRON_SECRET }),
		async c => {
			console.log("🔔 Starting notification delivery cron job")
			let worker = c.get("serverWorker")
			let result = await deliverNotifications(worker)
			return c.json(result)
		},
	)
