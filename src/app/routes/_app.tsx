import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { useAccount } from "jazz-tools/react"
import { useEffect } from "react"
import { UserAccount, isDeleted, isDueToday } from "#shared/schema/user"
import { Navigation } from "#app/components/navigation"
import { StatusIndicator } from "#app/components/status-indicator"
import {
	useCleanupInactiveLists,
	useCleanupEmptyGroups,
	useCleanupInaccessiblePeople,
} from "#app/hooks/use-cleanups"
import { useRegisterNotifications } from "#app/hooks/use-register-notifications"
import { useSafariSwipeHack } from "#shared/ui/swipeable-list-item"

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
			<StatusIndicator />
			<Navigation dueReminderCount={dueReminderCount} />
		</>
	)
}

function useDueReminders(): number {
	let me = useAccount(UserAccount, {
		resolve: {
			root: {
				people: {
					$each: {
						reminders: { $each: true },
						$onError: "catch",
					},
				},
			},
		},
	})

	let dueReminderCount = 0

	if (me.$isLoaded) {
		for (let person of me.root.people.values()) {
			if (!person?.$isLoaded || isDeleted(person)) continue
			for (let reminder of person.reminders.values()) {
				if (!reminder.done && !isDeleted(reminder) && isDueToday(reminder)) {
					dueReminderCount++
				}
			}
		}
	}

	useEffect(() => {
		if (dueReminderCount > 0) {
			navigator.setAppBadge?.(dueReminderCount)
		} else {
			navigator.clearAppBadge?.()
		}
	}, [dueReminderCount])

	return dueReminderCount
}
