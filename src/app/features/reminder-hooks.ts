import {
	Person,
	Reminder,
	isDeleted,
	isPermanentlyDeleted,
	sortByDueAt,
	sortByUpdatedAt,
	sortByDeletedAt,
	UserAccount,
} from "#shared/schema/user"
import { hasHashtag } from "#app/features/list-utilities"
import { useAccount, useCoState } from "jazz-tools/react-core"
import { co, type ResolveQuery } from "jazz-tools"

export {
	useReminders,
	usePersonReminders,
	extractSearchWithoutFilter,
	type RemindersLoadedAccount,
	type PersonRemindersLoadedPerson,
	type ReminderPair,
}

let remindersResolve = {
	root: {
		people: {
			$each: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let personRemindersResolve = {
	reminders: { $each: true },
	inactiveReminders: { $each: true },
} as const satisfies ResolveQuery<typeof Person>

type RemindersLoadedAccount = co.loaded<
	typeof UserAccount,
	typeof remindersResolve
>
type PersonRemindersLoadedPerson = co.loaded<
	typeof Person,
	typeof personRemindersResolve
>

type RemindersFilterOptions = {
	listFilter: string | null
	statusFilter: "active" | "done" | "deleted"
}

type ReminderPair = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
}

function useReminders(
	searchQuery: string,
	defaultAccount?: RemindersLoadedAccount,
	options?: RemindersFilterOptions,
): { reminders: ReminderPair[]; total: number } {
	let account = useAccount(UserAccount, {
		resolve: remindersResolve,
	})

	let loadedAccount = account.$isLoaded ? account : defaultAccount
	let people =
		loadedAccount?.root.people
			.filter(p => p.$isLoaded)
			.filter(p => !isDeleted(p) && !isPermanentlyDeleted(p)) ?? []

	let allReminderPairs: ReminderPair[] = []

	for (let person of people) {
		for (let reminder of person.reminders.values()) {
			if (isPermanentlyDeleted(reminder)) continue
			allReminderPairs.push({ reminder, person })
		}

		if (person.inactiveReminders?.$isLoaded) {
			for (let reminder of person.inactiveReminders.values()) {
				if (!reminder || isPermanentlyDeleted(reminder)) continue
				allReminderPairs.push({ reminder, person })
			}
		}
	}

	let searchLower = searchQuery.toLowerCase()
	let listFilter = options?.listFilter ?? null
	let statusFilter = options?.statusFilter ?? "active"

	let filteredPairs = allReminderPairs.filter(({ reminder, person }) => {
		let matchesSearch =
			!searchLower ||
			reminder.text.toLowerCase().includes(searchLower) ||
			person.name.toLowerCase().includes(searchLower)

		let matchesListFilter = !listFilter || hasHashtag(person, listFilter)

		let reminderIsDeleted =
			isDeleted(reminder) && !isPermanentlyDeleted(reminder)
		let reminderIsDone = reminder.done && !reminderIsDeleted
		let reminderIsActive = !reminder.done && !reminderIsDeleted

		let matchesStatusFilter =
			statusFilter === "active"
				? reminderIsActive
				: statusFilter === "done"
					? reminderIsDone
					: reminderIsDeleted

		return matchesSearch && matchesListFilter && matchesStatusFilter
	})

	// Sort based on status
	if (statusFilter === "active") {
		filteredPairs.sort(
			(a, b) =>
				new Date(a.reminder.dueAtDate).getTime() -
				new Date(b.reminder.dueAtDate).getTime(),
		)
	} else if (statusFilter === "done") {
		filteredPairs.sort((a, b) => {
			let aTime = (a.reminder.updatedAt || a.reminder.createdAt).getTime()
			let bTime = (b.reminder.updatedAt || b.reminder.createdAt).getTime()
			return bTime - aTime
		})
	} else {
		filteredPairs.sort((a, b) => {
			let aTime =
				a.reminder.deletedAt?.getTime() ??
				(
					a.reminder.updatedAt ||
					a.reminder.createdAt ||
					new Date(a.reminder.$jazz.lastUpdatedAt || a.reminder.$jazz.createdAt)
				).getTime()
			let bTime =
				b.reminder.deletedAt?.getTime() ??
				(
					b.reminder.updatedAt ||
					b.reminder.createdAt ||
					new Date(b.reminder.$jazz.lastUpdatedAt || b.reminder.$jazz.createdAt)
				).getTime()
			return bTime - aTime
		})
	}

	return { reminders: filteredPairs, total: allReminderPairs.length }
}

type PersonRemindersFilterOptions = {
	statusFilter: "active" | "done" | "deleted"
}

function usePersonReminders(
	personId: string,
	searchQuery: string,
	defaultPerson?: PersonRemindersLoadedPerson,
	options?: PersonRemindersFilterOptions,
): co.loaded<typeof Reminder>[] {
	let person = useCoState(Person, personId, {
		resolve: personRemindersResolve,
	})

	let loadedPerson = person.$isLoaded ? person : defaultPerson

	let allReminders = [
		...(loadedPerson?.reminders?.filter(r => !isPermanentlyDeleted(r)) ?? []),
		...(loadedPerson?.inactiveReminders?.filter(
			r => !isPermanentlyDeleted(r),
		) ?? []),
	]

	let searchLower = searchQuery.toLowerCase()
	let statusFilter = options?.statusFilter ?? "active"

	let filteredReminders = allReminders.filter(reminder => {
		let matchesSearch =
			!searchLower || reminder.text.toLowerCase().includes(searchLower)

		let reminderIsDeleted =
			isDeleted(reminder) && !isPermanentlyDeleted(reminder)
		let reminderIsDone = reminder.done && !reminderIsDeleted
		let reminderIsActive = !reminder.done && !reminderIsDeleted

		let matchesStatusFilter =
			statusFilter === "active"
				? reminderIsActive
				: statusFilter === "done"
					? reminderIsDone
					: reminderIsDeleted

		return matchesSearch && matchesStatusFilter
	})

	if (statusFilter === "active") {
		sortByDueAt(filteredReminders)
	} else if (statusFilter === "done") {
		sortByUpdatedAt(filteredReminders)
	} else {
		sortByDeletedAt(filteredReminders)
	}

	return filteredReminders
}

function extractSearchWithoutFilter(query: string): string {
	return query
		.toLowerCase()
		.replace(/^#[a-zA-Z0-9_]+\s*/, "")
		.trim()
}
