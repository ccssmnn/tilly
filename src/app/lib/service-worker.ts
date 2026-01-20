import { tryCatch } from "#shared/lib/trycatch"

export { getServiceWorkerRegistration, syncRemindersToServiceWorker }

async function getServiceWorkerRegistration() {
	if (!("serviceWorker" in navigator)) {
		return null
	}

	let result = await tryCatch(navigator.serviceWorker.getRegistration("/app/"))
	if (!result.ok) {
		console.error(
			"[SW] Failed to get service worker registration:",
			result.error,
		)
		return null
	}

	return result.data
}

function syncRemindersToServiceWorker(
	userId: string,
	reminders: ReminderData[],
) {
	if (!navigator.serviceWorker?.controller) return
	navigator.serviceWorker.controller.postMessage({
		type: "SET_REMINDERS",
		userId,
		reminders,
	})
}

type ReminderData = { id: string; dueAtDate: string }
