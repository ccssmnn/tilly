import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { authMiddleware, requireAuth } from "../lib/auth-middleware"
import { initUserWorker } from "../lib/utils"
import {
	getEnabledDevices,
	getIntl,
	sendNotificationToDevice,
	settingsQuery,
} from "./push-shared"

export { testNotificationApp }

let testNotificationApp = new Hono().post(
	"/send-test-notification",
	authMiddleware,
	requireAuth,
	zValidator("json", z.object({ endpoint: z.string() })),
	async c => {
		let { endpoint } = c.req.valid("json")

		let { worker } = await initUserWorker(c.get("user"))
		let workerWithSettings = await worker.$jazz.ensureLoaded({
			resolve: settingsQuery,
		})

		let notificationSettings = workerWithSettings.root.notificationSettings
		if (!notificationSettings) {
			let t = getIntl(workerWithSettings)
			return c.json(
				{ message: t("server.error.notificationSettingsNotConfigured") },
				400,
			)
		}

		let devices = getEnabledDevices(notificationSettings)
		let device = devices.find(d => d.endpoint === endpoint)
		if (!device) {
			let t = getIntl(workerWithSettings)
			let message = t("server.error.deviceNotInList")
			return c.json({ message }, 409)
		}

		let t = getIntl(workerWithSettings)
		let testPayload = {
			title: t("server.push.test-title"),
			body: t("server.push.test-body"),
			icon: "/favicon.ico",
			badge: "/favicon.ico",
			url: "/app/settings",
			userId: c.get("user").id,
			isTest: true,
		}

		let sendResult = await sendNotificationToDevice(device, testPayload)
		if (!sendResult.ok) {
			console.error("Failed to send test notification:", sendResult.error)
			let message = t("server.error.failedToSendNotification")
			return c.json({ message }, 500)
		}

		return c.json({ message: "success" })
	},
)
