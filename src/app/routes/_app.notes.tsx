import { createFileRoute, notFound } from "@tanstack/react-router"
import { NotesScreen, preloadNotesWithPeople } from "#app/features/notes"

export let Route = createFileRoute("/_app/notes")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let me = await preloadNotesWithPeople(context.me.$jazz.id)
		return { me }
	},
	component: NotesPage,
})

function NotesPage() {
	let { me } = Route.useLoaderData()
	return <NotesScreen fallback={me} />
}
