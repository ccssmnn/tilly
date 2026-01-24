import {
	isDeleted,
	sortByDueAt,
	sortByUpdatedAt,
	sortByDeletedAt,
} from "#shared/schema/user"
import { hasHashtag } from "#app/features/list-utilities"

export { filterReminders, filterPersonReminders, extractSearchWithoutFilter }
export type { RemindersFilterOptions, PersonRemindersFilterOptions }

type RemindersFilterOptions = {
	listFilter: string | null
	statusFilter: "active" | "done" | "deleted"
}

type ReminderLike = {
	text: string
	done: boolean
	dueAtDate: string
	deletedAt?: Date
	updatedAt?: Date
	createdAt?: Date
	$jazz: { lastUpdatedAt: number; createdAt: number }
}

type PersonLike = {
	name: string
	summary?: string
}

type ReminderPairLike<R extends ReminderLike, P extends PersonLike> = {
	reminder: R
	person: P
}

function filterReminders<
	R extends ReminderLike,
	P extends PersonLike,
	Pair extends ReminderPairLike<R, P>,
>(
	allReminderPairs: Pair[],
	searchQuery: string,
	options?: RemindersFilterOptions,
): { reminders: Pair[]; total: number } {
	let searchLower = searchQuery.toLowerCase()
	let listFilter = options?.listFilter ?? null
	let statusFilter = options?.statusFilter ?? "active"

	let filteredPairs = allReminderPairs.filter(({ reminder, person }) => {
		let matchesSearch =
			!searchLower ||
			reminder.text.toLowerCase().includes(searchLower) ||
			person.name.toLowerCase().includes(searchLower)

		let matchesListFilter = !listFilter || hasHashtag(person, listFilter)

		let reminderIsDeleted = isDeleted(reminder)
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
			let aTime = (a.reminder.updatedAt || a.reminder.createdAt)!.getTime()
			let bTime = (b.reminder.updatedAt || b.reminder.createdAt)!.getTime()
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

function filterPersonReminders<R extends ReminderLike>(
	allReminders: R[],
	searchQuery: string,
	options?: PersonRemindersFilterOptions,
): R[] {
	let searchLower = searchQuery.toLowerCase()
	let statusFilter = options?.statusFilter ?? "active"

	let filteredReminders = allReminders.filter(reminder => {
		let matchesSearch =
			!searchLower || reminder.text.toLowerCase().includes(searchLower)

		let reminderIsDeleted = isDeleted(reminder)
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
