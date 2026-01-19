import { useUser } from "@clerk/clerk-react"
import { tryCatch } from "#shared/lib/trycatch"
import { useCallback, useEffect } from "react"

export {
	useSyncUserIdToServiceWorker,
	getServiceWorkerRegistration,
	syncRemindersToServiceWorker,
}

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

function setUserIdInServiceWorker(userId: string) {
	if (!navigator.serviceWorker?.controller) {
		console.log("[App] No service worker controller available")
		return
	}

	navigator.serviceWorker.controller.postMessage({
		type: "SET_USER_ID",
		userId: userId,
	})
	console.log("[App] Sent user ID to service worker:", userId)
}

function clearUserIdInServiceWorker() {
	if (!navigator.serviceWorker?.controller) {
		console.log("[App] No service worker controller available")
		return
	}

	navigator.serviceWorker.controller.postMessage({
		type: "CLEAR_USER_ID",
	})
	console.log("[App] Cleared user ID in service worker")
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

function useSyncUserIdToServiceWorker() {
	let { user, isLoaded } = useUser()

	let syncUserId = useCallback(() => {
		if (!isLoaded) return

		if (user?.id) {
			setUserIdInServiceWorker(user.id)
		} else {
			clearUserIdInServiceWorker()
		}
	}, [isLoaded, user])

	useEffect(() => {
		syncUserId()
	}, [syncUserId])

	useEffect(() => {
		if (!("serviceWorker" in navigator)) return

		function handleControllerChange() {
			console.log("[App] Service worker controller changed, re-syncing user ID")
			setTimeout(syncUserId, 100)
		}

		navigator.serviceWorker.addEventListener(
			"controllerchange",
			handleControllerChange,
		)
		return () =>
			navigator.serviceWorker.removeEventListener(
				"controllerchange",
				handleControllerChange,
			)
	}, [syncUserId])
}

type ReminderData = { id: string; dueAtDate: string }
