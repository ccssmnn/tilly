import { useEffect, useState } from "react"

export { useOnlineStatus, useOfflineCapabilities }

function useOnlineStatus(): boolean {
	let [isOnline, setIsOnline] = useState(navigator.onLine)

	useEffect(() => {
		function handleOnline() {
			setIsOnline(true)
		}

		function handleOffline() {
			setIsOnline(false)
		}

		window.addEventListener("online", handleOnline)
		window.addEventListener("offline", handleOffline)

		return () => {
			window.removeEventListener("online", handleOnline)
			window.removeEventListener("offline", handleOffline)
		}
	}, [])

	return isOnline
}

function useOfflineCapabilities() {
	let isOnline = useOnlineStatus()

	return {
		isOnline,
		canUseChat: isOnline,
		canUseAccountSync: isOnline,
		canUsePushNotifications: isOnline,
		canUseLocalFeatures: true,
	}
}
