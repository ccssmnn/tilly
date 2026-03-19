import type { InviteData } from "../lib/invite"
import { useAcceptInvite } from "../hooks/use-accept-invite"
import {
	InviteLoadingState,
	InvalidInviteState,
	RevokedInviteState,
	InviteErrorState,
	SignInPromptState,
} from "../parts/invite-fallbacks"

export { InviteScreen }

type InviteScreenProps = {
	inviteData: InviteData | null
}

function InviteScreen({ inviteData }: InviteScreenProps) {
	let state = useAcceptInvite(inviteData)

	if (state.status === "invalid") return <InvalidInviteState />
	if (state.status === "unauthenticated") return <SignInPromptState />
	if (state.status === "revoked") return <RevokedInviteState />
	if (state.status === "error") return <InviteErrorState message={state.message} />
	return <InviteLoadingState />
}
