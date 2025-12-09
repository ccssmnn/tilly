import { useAuth } from "@clerk/clerk-react"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { PUBLIC_ENABLE_PAYWALL } from "astro:env/client"

export { useHasPlusAccess }

function useHasPlusAccess(): { hasPlusAccess: boolean; isLoading: boolean } {
	let clerkAuth = useAuth()
	let isOnline = useOnlineStatus()

	if (!PUBLIC_ENABLE_PAYWALL) return { hasPlusAccess: true, isLoading: false }

	// When offline and auth not loaded, assume access to avoid infinite loading
	// (Clerk won't load offline, but chat will be disabled anyway)
	if (!isOnline && !clerkAuth.isLoaded) {
		return { hasPlusAccess: true, isLoading: false }
	}

	if (!clerkAuth.isLoaded) return { hasPlusAccess: false, isLoading: true }
	if (!clerkAuth.isSignedIn) return { hasPlusAccess: false, isLoading: false }

	return { hasPlusAccess: clerkAuth.has({ plan: "plus" }), isLoading: false }
}
