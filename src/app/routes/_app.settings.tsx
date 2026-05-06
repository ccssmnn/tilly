import { createFileRoute, notFound } from "@tanstack/react-router"
import { SettingsScreen, preloadSettings } from "#app/features/settings"

export const Route = createFileRoute("/_app/settings")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let me = await preloadSettings(context.me.$jazz.id)
		if (!me.$isLoaded) throw notFound()
		return { me }
	},
	component: SettingsPage,
})

function SettingsPage() {
	let { me } = Route.useLoaderData()
	return <SettingsScreen fallback={me} />
}
