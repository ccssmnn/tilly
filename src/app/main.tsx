import { ClerkProvider, useClerk } from "@clerk/clerk-react"
import { JazzReactProviderWithClerk, useAccount } from "jazz-tools/react"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import {
	PUBLIC_JAZZ_SYNC_SERVER,
	PUBLIC_CLERK_PUBLISHABLE_KEY,
} from "astro:env/client"
import { UserAccount } from "#shared/schema/user"
import { routeTree } from "#app/routeTree.gen"
import { IntlProvider } from "#shared/intl/setup"
import { messagesDe } from "#shared/intl/messages"
import { useSyncUserIdToServiceWorker } from "#app/lib/service-worker"
import { useSyncRemindersToServiceWorker } from "#app/hooks/use-sync-reminders-to-sw"
import { PWAContext, usePWAProvider } from "#app/lib/pwa"
import { SplashScreen } from "./components/splash-screen"
import { Toaster } from "#shared/ui/sonner"
import { MainErrorBoundary } from "#app/components/main-error-boundary"

export function PWA() {
	return (
		<MainErrorBoundary>
			<ClerkProvider
				publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}
				afterSignOutUrl="/app"
			>
				<JazzWithClerk />
			</ClerkProvider>
		</MainErrorBoundary>
	)
}

function JazzWithClerk() {
	let pwaValue = usePWAProvider()
	useSyncUserIdToServiceWorker()
	let clerk = useClerk()
	let syncConfig = buildSyncConfig()

	return (
		<PWAContext.Provider value={pwaValue}>
			<JazzReactProviderWithClerk
				clerk={clerk}
				AccountSchema={UserAccount}
				sync={syncConfig}
				fallback={<SplashScreen />}
			>
				<RouterWithJazz />
				<Toaster richColors />
			</JazzReactProviderWithClerk>
		</PWAContext.Provider>
	)
}

function RouterWithJazz() {
	useSyncRemindersToServiceWorker()
	let me = useAccount(UserAccount, { resolve: { root: true } })

	// Only show splash screen if account is still loading
	if (me.$jazz.loadingState === "loading") return <SplashScreen />

	// Pass null for unauthenticated users, me object for authenticated users
	let contextMe
	if (me.$isLoaded) {
		contextMe = me
	} else {
		contextMe = null
	}

	let locale = contextMe?.root?.language || "en"

	if (locale === "de") {
		return (
			<IntlProvider messages={messagesDe} locale="de">
				<RouterProvider router={router} context={{ me: contextMe }} />
			</IntlProvider>
		)
	}
	return (
		<IntlProvider>
			<RouterProvider router={router} context={{ me: contextMe }} />
		</IntlProvider>
	)
}

function buildSyncConfig(): JazzSyncConfig {
	let syncServer = PUBLIC_JAZZ_SYNC_SERVER
	if (!isSyncPeer(syncServer)) {
		throw new Error("PUBLIC_JAZZ_SYNC_SERVER must be a ws:// or wss:// URL")
	}

	let syncConfig: JazzSyncConfig = {
		peer: syncServer,
		when: "signedUp",
	}

	return syncConfig
}

function isSyncPeer(value: string | undefined): value is SyncPeer {
	if (!value) return false
	return value.startsWith("ws://") || value.startsWith("wss://")
}

type JazzSyncProps = Parameters<typeof JazzReactProviderWithClerk>[0]["sync"]
type JazzSyncConfig = NonNullable<JazzSyncProps>
type SyncPeer = JazzSyncConfig["peer"]

let router = createRouter({
	basepath: "/app",
	routeTree,
	defaultGcTime: 0,
	defaultPreload: "viewport",
	scrollRestorationBehavior: "instant",
	scrollRestoration: true,
	context: { me: undefined! },
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
