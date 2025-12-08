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

export {
	useReminders,
	usePersonReminders,
	extractSearchWithoutFilter,
	type RemindersLoadedAccount,
	type PersonRemindersLoadedPerson,
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

function useReminders(
	searchQuery: string,
	defaultAccount?: RemindersLoadedAccount,
) {
	let account = useAccount(UserAccount, {
		resolve: remindersResolve,
	})

	let loadedAccount = account.$isLoaded ? account : defaultAccount
	let people =
		loadedAccount?.root.people.filter(
			(p): p is Extract<typeof p, { $isLoaded: true }> =>
				p?.$isLoaded === true && !isDeleted(p) && !isPermanentlyDeleted(p),
		) ?? []

	let allReminderPairs = []

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

	let filteredReminders = searchQuery
		? allReminders.filter(reminder =>
				reminder.text.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: allReminders

	let open = filteredReminders.filter(r => !r.done && !isDeleted(r))
	let done = filteredReminders.filter(r => r.done && !isDeleted(r))
	let deleted = filteredReminders.filter(r => isDeleted(r))

	sortByDueAt(open)
	sortByUpdatedAt(done)
	sortByDeletedAt(deleted)

	return { open, done, deleted }
}

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
