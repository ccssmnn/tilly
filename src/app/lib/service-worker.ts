import { useUser } from "@clerk/clerk-react"
import { tryCatch } from "#shared/lib/trycatch"
import { useCallback, useEffect } from "react"

export { useServiceWorker, getServiceWorkerRegistration }

let SERVICE_WORKER_URL = "/sw.js"
let SERVICE_WORKER_SCOPE = "/app/"

function useServiceWorker(options?: ServiceWorkerOptions) {
	useRegisterServiceWorker()
	useSyncUserIdToServiceWorker()
	useServiceWorkerUpdateChecks({
		intervalMs: options?.updateCheckIntervalMs,
	})
}

function useRegisterServiceWorker() {
	useEffect(() => {
		async function register() {
			if (!("serviceWorker" in navigator)) {
				console.log("Service workers not supported")
				return null
			}

			let result = await tryCatch(
				navigator.serviceWorker.register(SERVICE_WORKER_URL, {
					scope: SERVICE_WORKER_SCOPE,
					updateViaCache: "none",
				}),
			)

			if (!result.ok) {
				console.error("[SW] Service worker registration failed:", result.error)
				return null
			}

			let registration = result.data
			console.log("[SW] Service worker registered successfully:", registration)
			notifyWaitingWorker(registration.waiting)

			registration.addEventListener("updatefound", () => {
				let installing = registration.installing
				if (!installing) return

				installing.addEventListener("statechange", () => {
					if (
						installing.state === "installed" &&
						navigator.serviceWorker.controller
					) {
						notifyWaitingWorker(registration.waiting ?? installing)
					}
				})
			})

			navigator.serviceWorker.addEventListener("controllerchange", () => {
				console.log("[SW] Controller changed, will re-sync user ID")
				window.dispatchEvent(new CustomEvent("sw-controller-changed"))
			})

			return registration
		}

		register()
	}, [])
}

function useServiceWorkerUpdateChecks(options?: { intervalMs?: number }) {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return

		let intervalMs = options?.intervalMs ?? 2 * 60 * 60 * 1000
		let timer: number | null = null
		let abort = false

		async function doUpdateCheck() {
			if (abort) return
			let regResult = await tryCatch(
				navigator.serviceWorker.getRegistration("/app/"),
			)
			if (!regResult.ok) return
			let registration = regResult.data
			if (!registration) return
			await tryCatch(registration.update())
		}

		function handleVisibilityChange() {
			if (document.visibilityState === "visible") doUpdateCheck()
		}

		document.addEventListener("visibilitychange", handleVisibilityChange)
		timer = window.setInterval(doUpdateCheck, intervalMs)

		return () => {
			abort = true
			document.removeEventListener("visibilitychange", handleVisibilityChange)
			if (timer) window.clearInterval(timer)
		}
	}, [options?.intervalMs])
}

function notifyWaitingWorker(worker: ServiceWorker | null) {
	if (!worker) return
	if (!navigator.serviceWorker.controller) return
	window.dispatchEvent(
		new CustomEvent("sw-update-available", {
			detail: {
				type: "UPDATE_AVAILABLE",
				waitingWorker: worker,
			},
		}),
	)
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
	if (!navigator.serviceWorker.controller) {
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
	if (!navigator.serviceWorker.controller) {
		console.log("[App] No service worker controller available")
		return
	}

	navigator.serviceWorker.controller.postMessage({
		type: "CLEAR_USER_ID",
	})
	console.log("[App] Cleared user ID in service worker")
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
	}, [user, isLoaded])

	useEffect(() => {
		syncUserId()
	}, [syncUserId])

	useEffect(() => {
		function handleControllerChange() {
			console.log("[App] Service worker controller changed, re-syncing user ID")
			// Small delay to ensure new service worker is ready
			setTimeout(syncUserId, 100)
		}

		window.addEventListener("sw-controller-changed", handleControllerChange)
		return () =>
			window.removeEventListener(
				"sw-controller-changed",
				handleControllerChange,
			)
	}, [syncUserId])
}

type ServiceWorkerOptions = {
	updateCheckIntervalMs?: number
}
