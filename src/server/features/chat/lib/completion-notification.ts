import { nanoid } from "nanoid"
import type { User } from "@clerk/backend"
import type { co, Loaded } from "jazz-tools"
import { UserAccount, Assistant } from "#shared/schema/user"
import {
	getEnabledDevices,
	getIntl,
	sendNotificationToDevice,
	settingsQuery,
	type NotificationPayload,
} from "#server/features/push"

export { sendCompletionNotification }

type WorkerWithMessages = Loaded<
	typeof UserAccount,
	{ root: { assistant: { stringifiedMessages: true } } }
>

async function sendCompletionNotification(
	user: User,
	worker: WorkerWithMessages,
	logger: (step: string) => void,
) {
	try {
		let chat = worker.root.assistant
		if (!chat) {
			logger("No assistant chat, skipping notification")
			return
		}

		if (chat.notifyOnComplete === false) {
			logger("User disabled completion notifications, skipping")
			return
		}

		let acknowledged = await waitForAcknowledgment(chat, 3000)

		chat.$jazz.set("notificationCheckId", undefined)
		chat.$jazz.set("notificationAcknowledgedId", undefined)

		if (acknowledged) {
			logger("Client acknowledged presence, skipping notification")
			return
		}

		let workerWithSettings = await worker.$jazz.ensureLoaded({
			resolve: settingsQuery,
		})

		let notificationSettings = workerWithSettings.root.notificationSettings
		if (!notificationSettings) {
			logger("No notification settings, skipping notification")
			return
		}

		let devices = getEnabledDevices(notificationSettings)
		if (devices.length === 0) {
			logger("No enabled devices, skipping notification")
			return
		}

		let t = getIntl(workerWithSettings)
		let payload: NotificationPayload = {
			title: t("server.push.assistantComplete.title"),
			body: t("server.push.assistantComplete.body"),
			icon: "/favicon.ico",
			badge: "/favicon.ico",
			url: "/app/assistant",
			userId: user.id,
		}

		logger(`Sending completion notification to ${devices.length} devices`)

		let results = await Promise.allSettled(
			devices.map(device => sendNotificationToDevice(device, payload)),
		)

		let successCount = results.filter(
			r => r.status === "fulfilled" && r.value.ok,
		).length
		logger(
			`Completion notification sent to ${successCount}/${devices.length} devices`,
		)
	} catch (error) {
		console.error(
			`[Chat] ${user.id} | Failed to send completion notification:`,
			error,
		)
	}
}

async function waitForAcknowledgment(
	chat: co.loaded<typeof Assistant>,
	timeoutMs: number,
): Promise<boolean> {
	let checkId = nanoid()
	chat.$jazz.set("notificationCheckId", checkId)

	await chat.$jazz.waitForSync()

	return new Promise(resolve => {
		let timer = setTimeout(() => {
			unsubscribe()
			resolve(false)
		}, timeoutMs)

		let unsubscribe = chat.$jazz.subscribe(
			(updatedChat: co.loaded<typeof Assistant>) => {
				if (updatedChat.notificationAcknowledgedId === checkId) {
					clearTimeout(timer)
					unsubscribe()
					resolve(true)
				}
			},
		)
	})
}
