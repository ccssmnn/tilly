import { createFileRoute, notFound } from "@tanstack/react-router"
import {
	RemindersScreen,
	preloadRemindersWithPeople,
} from "#app/features/reminders"

export let Route = createFileRoute("/_app/reminders")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let me = await preloadRemindersWithPeople(context.me.$jazz.id)
		return { me }
	},
	component: RemindersPage,
})

function RemindersPage() {
	let { me } = Route.useLoaderData()
	return <RemindersScreen fallback={me} />
}
