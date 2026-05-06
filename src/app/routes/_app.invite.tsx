import { createFileRoute } from "@tanstack/react-router"
import { InviteScreen, getOrRestoreInviteData } from "#app/features/people"

export const Route = createFileRoute("/_app/invite")({
	loader: () => ({ inviteData: getOrRestoreInviteData() }),
	component: InviteScreenRoute,
})

function InviteScreenRoute() {
	let { inviteData } = Route.useLoaderData()
	return <InviteScreen inviteData={inviteData} />
}
