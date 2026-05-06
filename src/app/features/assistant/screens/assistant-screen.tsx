import { useAuth } from "@clerk/clerk-react"
import { useHasPlusAccess } from "#app/hooks/use-plus-access"
import { AssistantLayout } from "../parts/assistant-layout"
import { AssistantLoading } from "../parts/assistant-loading"
import { SubscribePrompt } from "../parts/subscribe-prompt"
import { AuthenticatedChat } from "../widgets/authenticated-chat"
import type { AssistantAccount } from "../lib/data"

export { AssistantScreen }

function AssistantScreen({ fallback }: { fallback: AssistantAccount }) {
	let auth = useAuth()
	let { hasPlusAccess, isLoading } = useHasPlusAccess()

	if (!auth.isLoaded) {
		return (
			<AssistantLayout hideTitle>
				<AssistantLoading />
			</AssistantLayout>
		)
	}

	if (!auth.isSignedIn) {
		return (
			<AssistantLayout hideTitle>
				<SubscribePrompt mode="signedOut" />
			</AssistantLayout>
		)
	}

	if (isLoading) {
		return (
			<AssistantLayout hideTitle>
				<AssistantLoading />
			</AssistantLayout>
		)
	}

	if (!hasPlusAccess) {
		return (
			<AssistantLayout hideTitle>
				<SubscribePrompt mode="plusRequired" />
			</AssistantLayout>
		)
	}

	return <AuthenticatedChat fallback={fallback} />
}
