import { useEffect, useState } from "react"

export {
	useIsPWAInstalled,
	useIsAndroid,
	useIsIOS,
	useIsMobileDevice,
	usePWAInstallPrompt,
}
export type { BeforeInstallPromptEvent }

function useIsPWAInstalled(): boolean {
	let [isInstalled, setIsInstalled] = useState(false)

	useEffect(() => {
		let checkInstalled = () => {
			let isStandalone = window.matchMedia("(display-mode: standalone)").matches
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let isIOSStandalone = (window.navigator as any).standalone === true
			setIsInstalled(isStandalone || isIOSStandalone)
		}

		checkInstalled()

		let mediaQuery = window.matchMedia("(display-mode: standalone)")
		mediaQuery.addEventListener("change", checkInstalled)

		return () => mediaQuery.removeEventListener("change", checkInstalled)
	}, [])

	return isInstalled
}

function useIsAndroid(): boolean {
	let [isAndroid, setIsAndroid] = useState(false)

	useEffect(() => {
		let userAgent = navigator.userAgent.toLowerCase()
		let isAndroidResult = userAgent.includes("android")
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsAndroid(isAndroidResult)
	}, [])

	return isAndroid
}

function useIsIOS(): boolean {
	let [isIOS, setIsIOS] = useState(false)

	useEffect(() => {
		let userAgent = navigator.userAgent.toLowerCase()
		let isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsIOS(isIOSDevice)
	}, [])

	return isIOS
}

function useIsMobileDevice(): boolean {
	let [isMobileDevice, setIsMobileDevice] = useState(false)

	useEffect(() => {
		let userAgent = navigator.userAgent.toLowerCase()
		let isMobile =
			/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
				userAgent,
			)
		let hasTouchScreen =
			"ontouchstart" in window || navigator.maxTouchPoints > 0
		let isMobileResult = isMobile || hasTouchScreen
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMobileDevice(isMobileResult)
	}, [])

	return isMobileDevice
}

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function usePWAInstallPrompt() {
	let [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null)
	let [canInstall, setCanInstall] = useState(false)

	useEffect(() => {
		function handleBeforeInstallPrompt(e: Event) {
			e.preventDefault()
			let promptEvent = e as BeforeInstallPromptEvent
			setDeferredPrompt(promptEvent)
			setCanInstall(true)
		}

		function handleAppInstalled() {
			setDeferredPrompt(null)
			setCanInstall(false)
		}

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
		window.addEventListener("appinstalled", handleAppInstalled)

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			)
			window.removeEventListener("appinstalled", handleAppInstalled)
		}
	}, [])

	let promptInstall = async (): Promise<"accepted" | "dismissed" | null> => {
		if (!deferredPrompt) return null

		await deferredPrompt.prompt()
		let choiceResult = await deferredPrompt.userChoice

		setDeferredPrompt(null)
		setCanInstall(false)

		return choiceResult.outcome
	}

	return { canInstall, promptInstall }
}
