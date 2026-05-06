import { createFileRoute, notFound } from "@tanstack/react-router"
import { PeopleScreen, preloadPeopleWithPeople } from "#app/features/people"

export let Route = createFileRoute("/_app/people/")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let me = await preloadPeopleWithPeople(context.me.$jazz.id)
		return { me }
	},
	component: PeoplePage,
})

function PeoplePage() {
	let { me } = Route.useLoaderData()
	return <PeopleScreen fallback={me} />
}
