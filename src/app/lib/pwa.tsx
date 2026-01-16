import type { Dispatch, SetStateAction } from "react"
import { createContext, useContext } from "react"
import { toast } from "sonner"
import { isMobileDevice, useIsPWAInstalled } from "#app/hooks/use-pwa"

export { PWAContext, usePWA, usePWAProvider }
export type { PWAContextValue }

type RegisterSWOptions = {
	onRegisteredSW?: (
		swUrl: string,
		registration: ServiceWorkerRegistration | undefined,
	) => void
	onRegisterError?: (error: Error) => void
	onNeedRefresh?: () => void
	onOfflineReady?: () => void
}

type RegisterSWResult = {
	needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
	offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
	updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

// @ts-expect-error - virtual module from vite-plugin-pwa
import { useRegisterSW as useRegisterSWUntyped } from "virtual:pwa-register/react"
let useRegisterSW = useRegisterSWUntyped as (
	options?: RegisterSWOptions,
) => RegisterSWResult

type PWAContextValue = {
	needRefresh: boolean
	offlineReady: boolean
	updateServiceWorker: () => Promise<void>
	checkForUpdates: () => Promise<void>
}

let PWAContext = createContext<PWAContextValue | null>(null)

function usePWA(): PWAContextValue {
	let context = useContext(PWAContext)
	if (!context) {
		return {
			needRefresh: false,
			offlineReady: false,
			updateServiceWorker: async () => {},
			checkForUpdates: async () => {},
		}
	}
	return context
}

function usePWAProvider(): PWAContextValue {
	let isPWAInstalled = useIsPWAInstalled()

	let {
		needRefresh: [needRefresh, setNeedRefresh],
		offlineReady: [offlineReady, setOfflineReady],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(
			swUrl: string,
			registration: ServiceWorkerRegistration | undefined,
		) {
			console.log("[PWA] Service worker registered:", swUrl)
			if (registration) {
				;(
					window as Window & { __swRegistration?: ServiceWorkerRegistration }
				).__swRegistration = registration
			}
		},
		onRegisterError(error: Error) {
			console.error("[PWA] Service worker registration error:", error)
		},
		onNeedRefresh() {
			setNeedRefresh(true)
		},
		onOfflineReady() {
			let showToast = !isMobileDevice() || isPWAInstalled
			if (showToast) {
				toast("Ready to work offline", {
					description: "App has been cached for offline use",
					duration: 4000,
				})
			}
			setTimeout(() => setOfflineReady(false), 4000)
		},
	})

	async function checkForUpdates() {
		let registration = (
			window as Window & { __swRegistration?: ServiceWorkerRegistration }
		).__swRegistration
		if (registration) {
			await registration.update()
		}
	}

	return {
		needRefresh,
		offlineReady,
		updateServiceWorker: () => updateServiceWorker(true),
		checkForUpdates,
	}
}
