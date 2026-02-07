import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { authenticateRequest } from "jazz-tools"
import { getServerWorker, WorkerTimeoutError } from "../lib/utils"
import {
	getEnabledDevices,
	getIntl,
	sendNotificationToDevice,
} from "./push-shared"

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

		let serverState = await serverWorker.$jazz.ensureLoaded({
			resolve: {
				root: {
					notificationSettingsRefsV2: {
						$each: { notificationSettings: true },
					},
				},
			},
		})

		let refs = serverState.root.notificationSettingsRefsV2
		if (!refs) {
			return c.json({ message: "Notification settings not configured" }, 400)
		}

		let userId = account.$jazz.id
		let ref = Object.values(refs).find(ref => ref?.userId === userId)
		let notificationSettings = ref?.notificationSettings

		if (!notificationSettings?.$isLoaded) {
			let t = getIntl({ root: { language: "en" } })
			return c.json(
				{ message: t("server.error.notificationSettingsNotConfigured") },
				400,
			)
		}

		let t = getIntl({ root: { language: notificationSettings.language } })

		let devices = getEnabledDevices(notificationSettings)
		let device = devices.find(d => d.endpoint === endpoint)
		if (!device) {
			let message = t("server.error.deviceNotInList")
			return c.json({ message }, 409)
		}

		let testPayload = {
			title: t("server.push.test-title"),
			body: t("server.push.test-body"),
			icon: "/favicon.ico",
			badge: "/favicon.ico",
			url: "/app/settings",
			userId,
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
