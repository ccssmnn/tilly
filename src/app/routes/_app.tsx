import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { useAccount } from "jazz-tools/react"
import type { ResolveQuery, co } from "jazz-tools"
import { useEffect } from "react"
import { UserAccount, isDeleted, isDueToday } from "#shared/schema/user"
import { Navigation } from "#app/components/navigation"
import { StatusIndicator } from "#app/components/status-indicator"
import {
	useCleanupInactiveLists,
	useCleanupEmptyGroups,
	useCleanupInaccessiblePeople,
} from "#app/hooks/use-cleanups"

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

	useCleanupInactiveLists()
	useCleanupEmptyGroups()
	useCleanupInaccessiblePeople()

	let dueReminderCount = countDueReminders(me)

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
				$onError: "catch",
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

type LoadedAccount = co.loaded<typeof UserAccount, typeof query>

function countDueReminders(me: LoadedAccount | { $isLoaded: false }): number {
	if (!me.$isLoaded) return 0

	let count = 0
	for (let person of me.root.people.values()) {
		if (!person?.$isLoaded || isDeleted(person)) continue
		for (let reminder of person.reminders.values()) {
			if (!reminder?.$isLoaded) continue
			if (!reminder.done && !isDeleted(reminder) && isDueToday(reminder)) {
				count++
			}
		}
	}
	return count
}
