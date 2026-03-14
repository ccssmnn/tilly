import { createFileRoute, notFound } from "@tanstack/react-router"
import {
	RemindersScreen,
	preloadRemindersWithPeople,
} from "#app/features/reminders"

export let Route = createFileRoute("/_app/reminders-test")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let me = await preloadRemindersWithPeople(context.me.$jazz.id)
		return { me }
	},
	component: RemindersTestPage,
})

function RemindersTestPage() {
	let { me } = Route.useLoaderData()
	return <RemindersScreen fallback={me} />
}
