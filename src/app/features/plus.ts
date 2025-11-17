import { useAuth } from "@clerk/clerk-react"
import { useIsAuthenticated } from "jazz-tools/react"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { PUBLIC_ENABLE_PAYWALL } from "astro:env/client"

export { useAssistantAccess }
export type { AssistantAccessStatus }

type AssistantAccessStatus = "loading" | "granted" | "denied"

function useAssistantAccess() {
	let clerkAuth = useAuth()
	let isSignedIn = useIsAuthenticated()
	let isOnline = useOnlineStatus()

	if (!isSignedIn) return { status: "denied" as const, isSignedIn }

	if (!PUBLIC_ENABLE_PAYWALL) return { status: "granted" as const, isSignedIn }

	// When offline, allow access to interface but chat will be disabled by canUseChat
	if (!isOnline) {
		// If auth is loaded, we can determine access status
		if (clerkAuth.isLoaded) {
			let status = determineAccessStatus({ auth: clerkAuth })
			return { status, isSignedIn }
		}
		// If auth isn't loaded yet, assume granted to avoid infinite loading
		return { status: "granted" as const, isSignedIn }
	}

	let status = determineAccessStatus({ auth: clerkAuth })

	return { status, isSignedIn }
}

function determineAccessStatus({
	auth,
}: {
	auth: ReturnType<typeof useAuth>
}): "granted" | "loading" | "denied" {
	if (!auth.isLoaded) return "loading"
	if (!auth.isSignedIn) return "denied"
	if (auth.has({ plan: "plus" })) return "granted"
	return "denied"
}
