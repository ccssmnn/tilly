import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useAccount } from "jazz-tools/react"
import type { ResolveQuery } from "jazz-tools"
import { useEffect } from "react"
import { UserAccount, isDeleted, isDueToday } from "#shared/schema/user"
import { Navigation } from "#app/components/navigation"
import { StatusIndicator } from "#app/components/status-indicator"

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ context }) => {
		return { me: context.me }
	},
	component: AppComponent,
})

function AppComponent() {
	let { me } = useAccount(UserAccount, { resolve: query })

	let people = me?.root?.people ?? []
	let dueReminderCount = people
		.filter(person => !isDeleted(person))
		.flatMap(person => person.reminders)
		.filter(reminder => reminder != null)
		.filter(reminder => !reminder.done && !isDeleted(reminder))
		.filter(reminder => isDueToday(reminder)).length

	useEffect(() => {
		setAppBadge(dueReminderCount)
	}, [dueReminderCount])

	// For unauthenticated users who skipped tour, show empty state
	if (!me) {
		return (
			<>
				<Outlet />
				<StatusIndicator />
				<Navigation dueReminderCount={0} />
			</>
		)
	}

	return (
		<>
			<Outlet />
			<StatusIndicator />
			<Navigation dueReminderCount={dueReminderCount} />
		</>
	)
}

let query = {
	root: {
		people: {
			$each: {
				avatar: true,
				notes: { $each: true },
				reminders: { $each: true },
			},
		},
	},
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
