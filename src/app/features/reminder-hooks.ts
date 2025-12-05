import {
	Person,
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

function extractListFilterFromQuery(query: string): string | null {
	let match = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	return match ? match[1].toLowerCase() : null
}

function extractSearchWithoutFilter(query: string): string {
	return query
		.toLowerCase()
		.replace(/^#[a-zA-Z0-9_]+\s*/, "")
		.trim()
}

export {
	useReminders,
	usePersonReminders,
	extractSearchWithoutFilter,
	type RemindersLoadedAccount,
	type PersonRemindersLoadedPerson,
}

let remindersResolve = {
	root: {
		people: { $each: { reminders: { $each: true }, inactiveReminders: { $each: true } } },
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

function useReminders(
	searchQuery: string,
	defaultAccount?: RemindersLoadedAccount,
) {
	let people = useAccount(UserAccount, {
		resolve: remindersResolve,
		select: account => {
			if (!account.$isLoaded) {
				if (defaultAccount) {
					return defaultAccount.root.people.filter(p => !isDeleted(p))
				}
				return []
			}
			return account.root.people.filter(p => !isDeleted(p))
		},
	})

	let allReminderPairs = []
	for (let person of people) {
		// Process active reminders
		for (let reminder of person.reminders.values()) {
			if (isPermanentlyDeleted(reminder)) continue
			allReminderPairs.push({ reminder, person })
		}

		// Process inactive reminders with 30-day cleanup
		if (person.inactiveReminders) {
			let thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

			for (let reminder of person.inactiveReminders.values()) {
				if (isPermanentlyDeleted(reminder)) continue

				// Perform 30-day cleanup
				if (
					reminder.deletedAt &&
					!reminder.permanentlyDeletedAt &&
					reminder.deletedAt < thirtyDaysAgo
				) {
					reminder.$jazz.set("permanentlyDeletedAt", reminder.deletedAt)
					continue
				}

				allReminderPairs.push({ reminder, person })
			}
		}
	}

	let searchLower = searchQuery.toLowerCase()
	let listFilter = extractListFilterFromQuery(searchLower)
	let searchWithoutFilter = searchLower.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()

	let filteredPairs = allReminderPairs.filter(({ reminder, person }) => {
		let matchesSearch =
			!searchWithoutFilter ||
			reminder.text.toLowerCase().includes(searchWithoutFilter) ||
			person.name.toLowerCase().includes(searchWithoutFilter)

		let matchesFilter = !listFilter || hasHashtag(person, listFilter)

		return matchesSearch && matchesFilter
	})

	let open = []
	let done = []
	let deleted = []

	for (let { reminder, person } of filteredPairs) {
		if (isDeleted(reminder) && !isPermanentlyDeleted(reminder)) {
			deleted.push({ reminder, person })
		} else if (reminder.done) {
			done.push({ reminder, person })
		} else {
			open.push({ reminder, person })
		}
	}

	open.sort(
		(a, b) =>
			new Date(a.reminder.dueAtDate).getTime() -
			new Date(b.reminder.dueAtDate).getTime(),
	)

	done.sort((a, b) => {
		let aTime = (a.reminder.updatedAt || a.reminder.createdAt).getTime()
		let bTime = (b.reminder.updatedAt || b.reminder.createdAt).getTime()
		return bTime - aTime
	})

	deleted.sort((a, b) => {
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

	return { open, done, deleted, total: allReminderPairs.length }
}

function usePersonReminders(
	personId: string,
	searchQuery: string,
	defaultPerson?: PersonRemindersLoadedPerson,
) {
	let reminders = useCoState(Person, personId, {
		resolve: personRemindersResolve,
		select: person => {
			if (!person.$isLoaded) {
				if (defaultPerson && defaultPerson.$jazz.id === personId) {
					let active = defaultPerson.reminders.filter(r => !isPermanentlyDeleted(r))
					let inactive = defaultPerson.inactiveReminders
						? defaultPerson.inactiveReminders.filter(r => !isPermanentlyDeleted(r))
						: []
					return [...active, ...inactive]
				}
				return []
			}

			// Perform 30-day cleanup on inactive reminders
			if (person.inactiveReminders) {
				let thirtyDaysAgo = new Date()
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

				for (let reminder of person.inactiveReminders.values()) {
					if (
						reminder.deletedAt &&
						!reminder.permanentlyDeletedAt &&
						reminder.deletedAt < thirtyDaysAgo
					) {
						reminder.$jazz.set("permanentlyDeletedAt", reminder.deletedAt)
					}
				}
			}

			let active = person.reminders.filter(r => !isPermanentlyDeleted(r))
			let inactive = person.inactiveReminders
				? person.inactiveReminders.filter(r => !isPermanentlyDeleted(r))
				: []
			return [...active, ...inactive]
		},
	})

	let filteredReminders = searchQuery
		? reminders.filter(reminder => {
				let searchLower = searchQuery.toLowerCase()
				return reminder.text.toLowerCase().includes(searchLower)
			})
		: reminders

	let open = filteredReminders.filter(r => !r.done && !isDeleted(r))
	let done = filteredReminders.filter(r => r.done && !isDeleted(r))
	let deleted = filteredReminders.filter(r => isDeleted(r))

	sortByDueAt(open)
	sortByUpdatedAt(done)
	sortByDeletedAt(deleted)

	return { open, done, deleted }
}
