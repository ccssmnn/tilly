import { useAuth } from "@clerk/clerk-react"
import { PUBLIC_ENABLE_PAYWALL } from "astro:env/client"

export { useHasPlusAccess }

function useHasPlusAccess(): { hasPlusAccess: boolean; isLoading: boolean } {
	let clerkAuth = useAuth()

	if (!PUBLIC_ENABLE_PAYWALL) return { hasPlusAccess: true, isLoading: false }

	if (!clerkAuth.isLoaded) return { hasPlusAccess: false, isLoading: true }
	if (!clerkAuth.isSignedIn) return { hasPlusAccess: false, isLoading: false }

	return { hasPlusAccess: clerkAuth.has({ plan: "plus" }), isLoading: false }
}
