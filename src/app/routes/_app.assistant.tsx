import { createFileRoute, notFound } from "@tanstack/react-router"
import { AssistantScreen, preloadAssistant } from "#app/features/assistant"

export let Route = createFileRoute("/_app/assistant")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let me = await preloadAssistant(context.me.$jazz.id)
		return { me }
	},
	component: AssistantPage,
})

function AssistantPage() {
	let { me } = Route.useLoaderData()
	return <AssistantScreen me={me} />
}
