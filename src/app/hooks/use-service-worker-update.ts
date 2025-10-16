import { useEffect, useState } from "react"

export { useServiceWorkerUpdate }

function useServiceWorkerUpdate() {
	let [updateAvailable, setUpdateAvailable] = useState(false)
	let [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

	useEffect(() => {
		if (!("serviceWorker" in navigator)) {
			return
		}

		let stopped = false

		async function trackRegistration() {
			try {
				let found = await navigator.serviceWorker.getRegistration("/app/")
				if (!found || stopped) return

				if (found.waiting && navigator.serviceWorker.controller) {
					setUpdateAvailable(true)
					setWaitingWorker(found.waiting)
				}

				let handleUpdateFound = () => {
					let installing = found.installing
					if (!installing) return
					installing.addEventListener("statechange", () => {
						if (
							installing.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							let waiting = found.waiting ?? installing
							if (isServiceWorker(waiting)) {
								setUpdateAvailable(true)
								setWaitingWorker(waiting)
							}
						}
					})
				}

				found.addEventListener("updatefound", handleUpdateFound)

				return () => {
					found.removeEventListener("updatefound", handleUpdateFound)
				}
			} catch (error) {
				console.error("[SW Update] Error checking for updates:", error)
			}
		}

		let removeUpdateFoundListener: (() => void) | undefined

		function handleUpdateEvent(event: Event) {
			let detail = getUpdateAvailableDetail(event)
			if (!detail) return
			setUpdateAvailable(true)
			if (detail.waitingWorker) {
				setWaitingWorker(detail.waitingWorker)
			}
		}

		window.addEventListener("sw-update-available", handleUpdateEvent)
		trackRegistration().then(dispose => {
			removeUpdateFoundListener = dispose
			if (stopped && dispose) {
				dispose()
				removeUpdateFoundListener = undefined
			}
		})

		return () => {
			stopped = true
			if (removeUpdateFoundListener) {
				removeUpdateFoundListener()
				removeUpdateFoundListener = undefined
			}
			window.removeEventListener("sw-update-available", handleUpdateEvent)
		}
	}, [])

	let applyUpdate = async (): Promise<boolean> => {
		try {
			if (!waitingWorker) {
				return false
			}

			waitingWorker.postMessage({ type: "SKIP_WAITING" })
			await new Promise<void>(resolve => {
				let finished = false

				function cleanup() {
					if (finished) return
					finished = true
					navigator.serviceWorker?.removeEventListener(
						"controllerchange",
						handleControllerChange,
					)
					resolve()
				}

				function handleControllerChange() {
					cleanup()
				}

				navigator.serviceWorker?.addEventListener(
					"controllerchange",
					handleControllerChange,
				)

				setTimeout(cleanup, 1000)
			})

			window.location.reload()
			return true
		} catch (error) {
			console.error("[SW Update] Error applying update:", error)
			return false
		}
	}

	return {
		updateAvailable,
		applyUpdate,
	}
}

type UpdateAvailableDetail = {
	type: "UPDATE_AVAILABLE"
	waitingWorker: ServiceWorker | null
}

declare global {
	interface WindowEventMap {
		"sw-update-available": CustomEvent<UpdateAvailableDetail>
	}
}

function getUpdateAvailableDetail(event: Event): UpdateAvailableDetail | null {
	let detail = Reflect.get(event, "detail")
	if (typeof detail !== "object" || detail === null) return null
	let typeValue = Reflect.get(detail, "type")
	if (typeValue !== "UPDATE_AVAILABLE") return null
	let waitingValue = Reflect.get(detail, "waitingWorker")
	return {
		type: "UPDATE_AVAILABLE",
		waitingWorker: isServiceWorker(waitingValue) ? waitingValue : null,
	}
}

function isServiceWorker(value: unknown): value is ServiceWorker {
	if (typeof value !== "object" || value === null) return false
	let postMessage = Reflect.get(value, "postMessage")
	let state = Reflect.get(value, "state")
	return typeof postMessage === "function" && typeof state === "string"
}
