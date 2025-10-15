import { useEffect, useState } from "react"

export { useOnlineStatus }

function useOnlineStatus(): boolean {
	let [isOnline, setIsOnline] = useState(navigator.onLine)
	let [hasCheckedConnectivity, setHasCheckedConnectivity] = useState(false)

	useEffect(() => {
		if (navigator.onLine && !hasCheckedConnectivity) {
			checkConnectivity()
		}

		window.addEventListener("online", handleOnline)
		window.addEventListener("offline", handleOffline)

		return () => {
			window.removeEventListener("online", handleOnline)
			window.removeEventListener("offline", handleOffline)
		}
	}, [hasCheckedConnectivity])

	async function checkConnectivity() {
		try {
			await fetch("/online-check", {
				method: "GET",
				cache: "no-cache",
				signal: AbortSignal.timeout(2000),
			})
			setIsOnline(true)
		} catch {
			setIsOnline(false)
		} finally {
			setHasCheckedConnectivity(true)
		}
	}

	function handleOnline() {
		setIsOnline(true)
	}

	function handleOffline() {
		setIsOnline(false)
	}

	return isOnline
}
