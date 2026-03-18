import { useState } from "react"
import { tryCatch } from "#shared/lib/trycatch"

export { useCurrentEndpoint }

function useCurrentEndpoint(): [string | null | undefined, () => void] {
	let [endpoint, setEndpoint] = useState<string | null | undefined>(undefined)
	let [initialized, setInitialized] = useState(false)

	async function refreshCurrentEndpoint() {
		async function getCurrentPushEndpoint(): Promise<string | null> {
			if ("serviceWorker" in navigator && "PushManager" in window) {
				let result = await tryCatch(
					(async () => {
						let registration = await navigator.serviceWorker.ready
						let subscription = await registration.pushManager.getSubscription()
						return subscription?.endpoint || null
					})(),
				)
				return result.ok ? result.data : null
			}
			return null
		}

		let newEndpoint = await getCurrentPushEndpoint()
		setEndpoint(newEndpoint)
	}

	if (!initialized) {
		setInitialized(true)
		refreshCurrentEndpoint()
	}

	return [endpoint, refreshCurrentEndpoint]
}
