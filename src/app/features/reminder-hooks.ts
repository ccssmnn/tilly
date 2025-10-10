import {
	Person,
	Reminder,
	isDeleted,
	isPermanentlyDeleted,
	sortByDueAt,
	sortByUpdatedAt,
	sortByDeletedAt,
} from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"

export { useReminders, usePersonReminders }

function useReminders<Q extends ResolveQuery<typeof Person>>(
	people: Array<co.loaded<typeof Person, Q>>,
	searchQuery: string,
) {
	let allReminderPairs: Array<{
		reminder: co.loaded<typeof Reminder>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of people) {
		if (isPermanentlyDeleted(person) || isDeleted(person)) continue
		if (!person.reminders) continue

		for (let reminder of person.reminders) {
			if (!reminder || isPermanentlyDeleted(reminder)) continue
			allReminderPairs.push({ reminder, person })
		}
	}

	let filteredPairs = searchQuery
		? allReminderPairs.filter(({ reminder, person }) => {
				let searchLower = searchQuery.toLowerCase()
				return (
					reminder.text.toLowerCase().includes(searchLower) ||
					person.name.toLowerCase().includes(searchLower)
				)
			})
		: allReminderPairs

	let open: typeof allReminderPairs = []
	let done: typeof allReminderPairs = []
	let deleted: typeof allReminderPairs = []

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

function usePersonReminders<Q extends ResolveQuery<typeof Person>>(
	person: co.loaded<typeof Person, Q>,
	searchQuery: string,
) {
	if (!person.reminders) return { open: [], done: [], deleted: [] }

	let filteredReminders = searchQuery
		? person.reminders.filter(reminder => {
				if (!reminder || isPermanentlyDeleted(reminder)) return false
				let searchLower = searchQuery.toLowerCase()
				return reminder.text.toLowerCase().includes(searchLower)
			})
		: person.reminders.filter(
				reminder => reminder && !isPermanentlyDeleted(reminder),
			)

	let open = filteredReminders.filter(
		r => r && !isDeleted(r) && !r.done,
	) as Array<co.loaded<typeof Reminder>>
	let done = filteredReminders.filter(
		r => r && !isDeleted(r) && r.done,
	) as Array<co.loaded<typeof Reminder>>
	let deleted = filteredReminders.filter(
		r => r && isDeleted(r) && !isPermanentlyDeleted(r),
	) as Array<co.loaded<typeof Reminder>>

	sortByDueAt(open)
	sortByUpdatedAt(done)
	sortByDeletedAt(deleted)

	return { open, done, deleted }
}
