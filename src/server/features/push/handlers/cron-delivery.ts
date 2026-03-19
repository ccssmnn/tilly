import { CRON_SECRET } from "astro:env/server"
import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { getServerWorker, WorkerTimeoutError } from "#server/lib/utils"
import { deliverNotifications } from "../operations/deliver-notifications"

export { cronDeliveryApp }

let cronDeliveryApp = new Hono().get(
	"/deliver-notifications",
	bearerAuth({ token: CRON_SECRET }),
	async c => {
		console.log("🔔 Starting notification delivery cron job")

		let worker
		try {
			worker = await getServerWorker()
		} catch (error) {
			if (error instanceof WorkerTimeoutError) {
				return c.json({ error: error.message, code: "worker-timeout" }, 504)
			}
			throw error
		}

		let result = await deliverNotifications(worker)
		return c.json(result)
	},
)
