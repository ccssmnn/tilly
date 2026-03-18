import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { PersonScreen, preloadPerson } from "#app/features/people"

export const Route = createFileRoute("/_app/people/$personID")({
	validateSearch: z.object({
		tab: z.enum(["notes", "reminders"]).optional().default("notes"),
	}),
	loader: ({ params }) => preloadPerson(params.personID),
	component: PersonScreenRoute,
})

function PersonScreenRoute() {
	let { personID } = Route.useParams()
	let data = Route.useLoaderData()
	let { tab } = Route.useSearch()
	let navigate = Route.useNavigate()

	return (
		<PersonScreen
			personId={personID}
			loaderPerson={data.person}
			loadingState={data.loadingState}
			tab={tab}
			onTabChange={nextTab =>
				navigate({
					search: prev => ({ ...prev, tab: nextTab }),
					replace: true,
					resetScroll: false,
				})
			}
		/>
	)
}
