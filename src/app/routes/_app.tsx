import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { useAccount } from "jazz-tools/react"
import type { ResolveQuery } from "jazz-tools"
import { useEffect } from "react"
import { UserAccount, isDeleted, isDueToday } from "#shared/schema/user"
import { Navigation } from "#app/components/navigation"
import { StatusIndicator } from "#app/components/status-indicator"
import { useInactiveCleanup } from "#shared/lib/jazz-list-utils"

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ context }) => {
		if (!context.me) throw notFound()
		return { me: context.me }
	},
	component: AppComponent,
})

function AppComponent() {
	let me = useAccount(UserAccount, {
		resolve: query,
	})

	let inactiveData = useAccount(UserAccount, {
		resolve: inactiveQuery,
	})

	useInactiveCleanup(
		me.$isLoaded ? me.root.people : undefined,
		inactiveData.$isLoaded ? inactiveData.root.inactivePeople : undefined,
	)

	let dueReminderCount = (me.$isLoaded ? me.root.people : [])
		.filter(person => !isDeleted(person))
		.flatMap(person => person.reminders)
		.filter(reminder => reminder.$isLoaded)
		.filter(reminder => !reminder.done && !isDeleted(reminder))
		.filter(reminder => isDueToday(reminder)).length

	useEffect(() => {
		setAppBadge(dueReminderCount)
	}, [dueReminderCount])

	return (
		<>
			<Outlet />
			<StatusIndicator />
			<Navigation dueReminderCount={dueReminderCount} />
		</>
	)
}

let query = {
	profile: true,
	root: {
		assistant: true,
		notificationSettings: true,
		usageTracking: true,
		people: {
			$each: {
				avatar: true,
				notes: { $each: true },
				inactiveNotes: { $each: true },
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let inactiveQuery = {
	root: { inactivePeople: { $each: true } },
} as const satisfies ResolveQuery<typeof UserAccount>

async function setAppBadge(count: number) {
	let isAppBadgeSupported =
		"setAppBadge" in navigator && "clearAppBadge" in navigator
	if (!isAppBadgeSupported) return

	try {
		if (count > 0) {
			await navigator.setAppBadge(count)
		} else {
			await navigator.clearAppBadge()
		}
	} catch (error) {
		console.warn("Failed to set app badge:", error)
	}
}
