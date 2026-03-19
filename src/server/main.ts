import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { chatMessagesApp } from "./features/chat"
import { cronDeliveryApp, testNotificationApp, pushRegisterApp } from "./features/push"
import { authMiddleware } from "./features/auth"

let authenticatedRoutes = new Hono()
	.use(authMiddleware)
	.route("/chat", chatMessagesApp)

export let app = new Hono()
	.use(logger())
	.use(cors())
	.route("/push", testNotificationApp)
	.route("/push", cronDeliveryApp)
	.route("/push", pushRegisterApp)
	.route("/", authenticatedRoutes)

export type AppType = typeof app
