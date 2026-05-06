/**
 * Syncs active reminders to the service worker for push notification decisions.
 *
 * The SW uses cached reminders (keyed by userId) as the source of truth for
 * whether a user is signed in. This eliminates separate userId caching because:
 * - Push payloads always include userId
 * - When userId in payload matches reminders cache key → user is signed in
 * - When no match → cache is stale (user signed out), notification suppressed
 */

import { useAccount } from "jazz-tools/react"
import { useEffect, useMemo } from "react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { syncRemindersToServiceWorker } from "#app/lib/service-worker"

export { useSyncRemindersToServiceWorker }

let remindersQuery = {
	root: {
		notificationSettings: true,
		people: {
			$each: {
				reminders: { $each: true },
			},
		},
	},
} as const

function useSyncRemindersToServiceWorker() {
	let me = useAccount(UserAccount, { resolve: remindersQuery })

	let remindersKey = useMemo(() => {
		if (!me.$isLoaded) return null
		let reminders: { id: string; dueAtDate: string }[] = []
		for (let person of me.root.people.values()) {
			if (!person?.reminders || isDeleted(person)) continue
			for (let reminder of person.reminders.values()) {
				if (!reminder || reminder.done || isDeleted(reminder)) continue
				reminders.push({ id: reminder.$jazz.id, dueAtDate: reminder.dueAtDate })
			}
		}
		reminders.sort((a, b) => a.id.localeCompare(b.id))
		return JSON.stringify(reminders)
	}, [me])

	let timezone = me.$isLoaded
		? me.root.notificationSettings?.timezone ||
			Intl.DateTimeFormat().resolvedOptions().timeZone
		: Intl.DateTimeFormat().resolvedOptions().timeZone

	useEffect(() => {
		let jazzUserId = me.$isLoaded ? me.$jazz.id : undefined
		if (!jazzUserId || !remindersKey) return
		let reminders = JSON.parse(remindersKey) as {
			id: string
			dueAtDate: string
		}[]
		let todayStr = new Date()
			.toLocaleDateString("sv-SE", { timeZone: timezone })
			.slice(0, 10)
		syncRemindersToServiceWorker(jazzUserId, reminders, todayStr)
	}, [me, remindersKey, timezone])
}
