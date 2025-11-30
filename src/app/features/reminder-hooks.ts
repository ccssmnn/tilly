import {
	Person,
	isDeleted,
	isPermanentlyDeleted,
	sortByDueAt,
	sortByUpdatedAt,
	sortByDeletedAt,
	UserAccount,
	hasHashtag,
} from "#shared/schema/user"
import { useAccount, useCoState } from "jazz-tools/react-core"
import { co, type ResolveQuery } from "jazz-tools"

function extractListFilterFromQuery(query: string): string | null {
	let match = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	return match ? match[1].toLowerCase() : null
}

export {
	useReminders,
	usePersonReminders,
	type RemindersLoadedAccount,
	type PersonRemindersLoadedPerson,
}

let remindersResolve = {
	root: { people: { $each: { reminders: { $each: true } } } },
} as const satisfies ResolveQuery<typeof UserAccount>

let personRemindersResolve = {
	reminders: { $each: true },
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
		for (let reminder of person.reminders.values()) {
			if (isPermanentlyDeleted(reminder)) continue
			allReminderPairs.push({ reminder, person })
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
					return defaultPerson.reminders.filter(r => !isPermanentlyDeleted(r))
				}
				return []
			}
			return person.reminders.filter(r => !isPermanentlyDeleted(r))
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
