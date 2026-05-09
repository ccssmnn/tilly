import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { Navigation } from "#app/components/navigation"
import { AppStatusIndicator } from "#app/components/status-indicator"
import {
	useCleanupInactiveLists,
	useCleanupEmptyGroups,
	useCleanupInaccessiblePeople,
} from "#app/hooks/use-cleanups"
import { useRegisterNotifications } from "#app/features/settings"
import { useSafariSwipeHack } from "#app/components/swipeable-list-item"
import { useDueReminders } from "#app/features/reminders"

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ context }) => {
		if (!context.me) throw notFound()
		return { me: context.me }
	},
	component: AppComponent,
})

function AppComponent() {
	useSafariSwipeHack()
	useCleanupInactiveLists()
	useCleanupEmptyGroups()
	useCleanupInaccessiblePeople()
	useRegisterNotifications()

	let dueReminderCount = useDueReminders()

	return (
		<>
			<Outlet />
			<AppStatusIndicator />
			<Navigation dueReminderCount={dueReminderCount} />
		</>
	)
}
