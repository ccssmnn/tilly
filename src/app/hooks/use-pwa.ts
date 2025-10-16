import { useEffect, useState } from "react"

export {
	useIsPWAInstalled,
	useIsAndroid,
	useIsIOS,
	useIsMobileDevice,
	useIsInAppBrowser,
	usePWAInstallPrompt,
}
export type { BeforeInstallPromptEvent }

function useIsPWAInstalled(): boolean {
	let [isInstalled, setIsInstalled] = useState(false)

	useEffect(() => {
		let checkInstalled = () => {
			let isStandalone = window.matchMedia("(display-mode: standalone)").matches
			let isIOSStandalone =
				(window.navigator as unknown as { standalone: boolean }).standalone ===
				true
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
	let userAgent = navigator.userAgent.toLowerCase()
	let isAndroidResult = userAgent.includes("android")
	return isAndroidResult
}

function useIsIOS(): boolean {
	let userAgent = navigator.userAgent.toLowerCase()
	let isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
	return isIOSDevice
}

function useIsMobileDevice(): boolean {
	let userAgent = navigator.userAgent.toLowerCase()
	let isMobile =
		/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
			userAgent,
		)
	let hasTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints > 0
	let isMobileResult = isMobile || hasTouchScreen

	return isMobileResult
}

function useIsInAppBrowser(): boolean {
	let userAgent = navigator.userAgent
	let isInApp =
		userAgent.includes("Instagram") ||
		userAgent.includes("FBAN") ||
		userAgent.includes("FBAV") ||
		userAgent.includes("Twitter") ||
		userAgent.includes("LinkedIn")
	return isInApp
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
