import { UserAccount, Person, Reminder, isDeleted } from "#shared/schema/user"
import { useAccount } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"
import { hasHashtag } from "#app/features/list-utilities"

export { preloadRemindersWithPeople, useRemindersData, type RemindersData }

let resolve = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: { $onError: "catch" } },
				inactiveReminders: { $each: { $onError: "catch" } },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAccount = co.loaded<typeof UserAccount, typeof resolve>

type ReminderPair = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
}

type StatusFilter = "active" | "done" | "deleted"

type RemindersData = {
	reminders: ReminderPair[]
	people: co.loaded<typeof Person>[]
	total: number
}

async function preloadRemindersWithPeople(
	accountId: string,
): Promise<LoadedAccount> {
	let me = await UserAccount.load(accountId, { resolve })
	if (!me.$isLoaded) throw new Error("Failed to load account")
	return me
}

function useRemindersData(
	fallback: LoadedAccount,
	options?: {
		query?: string
		statusFilter?: StatusFilter
		listFilter?: string | null
	},
): RemindersData {
	let subscribed = useAccount(UserAccount, { resolve })
	let me = subscribed.$isLoaded ? subscribed : fallback
	let searchLower = (options?.query ?? "").toLowerCase()
	let statusFilter = options?.statusFilter ?? "active"
	let listFilter = options?.listFilter ?? null

	let people = me.root.people
		.filter(p => p.$isLoaded)
		.filter(p => !isDeleted(p))

	let all: ReminderPair[] = []
	for (let person of people) {
		for (let reminder of person.reminders.values()) {
			if (!reminder.$isLoaded) continue
			all.push({ reminder, person })
		}
		if (person.inactiveReminders?.$isLoaded) {
			for (let reminder of person.inactiveReminders.values()) {
				if (!reminder?.$isLoaded) continue
				all.push({ reminder, person })
			}
		}
	}

	let filtered = all.filter(({ reminder, person }) => {
		let reminderIsDeleted = isDeleted(reminder)
		let reminderIsDone = reminder.done && !reminderIsDeleted
		let reminderIsActive = !reminder.done && !reminderIsDeleted

		let matchesStatus =
			statusFilter === "active"
				? reminderIsActive
				: statusFilter === "done"
					? reminderIsDone
					: reminderIsDeleted

		let matchesList = !listFilter || hasHashtag(person, listFilter)

		let matchesSearch =
			!searchLower ||
			reminder.text.toLowerCase().includes(searchLower) ||
			person.name.toLowerCase().includes(searchLower)

		return matchesStatus && matchesList && matchesSearch
	})

	if (statusFilter === "active") {
		filtered.sort(
			(a, b) =>
				new Date(a.reminder.dueAtDate).getTime() -
				new Date(b.reminder.dueAtDate).getTime(),
		)
	} else if (statusFilter === "done") {
		filtered.sort((a, b) => {
			let aTime = (a.reminder.updatedAt || a.reminder.createdAt).getTime()
			let bTime = (b.reminder.updatedAt || b.reminder.createdAt).getTime()
			return bTime - aTime
		})
	} else {
		filtered.sort((a, b) => {
			let aTime = a.reminder.deletedAt?.getTime() ?? 0
			let bTime = b.reminder.deletedAt?.getTime() ?? 0
			return bTime - aTime
		})
	}

	return { reminders: filtered, people, total: all.length }
}
