import {
	Person,
	Note,
	Reminder,
	isDeleted,
	isDueToday,
} from "#shared/schema/user"
import { useCoState } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"
import { useEffect } from "react"
import {
	getLoadedCoListValues,
	removeDeletedCoValueRefs,
} from "#shared/lib/co-list-utils"

export {
	usePersonNotes,
	usePersonReminders,
	usePersonHasDueReminders,
	preloadPerson,
	personResolve,
	type LoadedPerson,
	type PersonLoadingState,
}

type NotesStatusFilter = "active" | "deleted"
type RemindersStatusFilter = "active" | "done" | "deleted"

type PersonLoadingState = "unauthorized" | "unavailable" | null

let personResolve = {
	avatar: true,
	notes: { $each: { $onError: "catch" } },
	reminders: { $each: { $onError: "catch" } },
} as const satisfies ResolveQuery<typeof Person>

type LoadedPerson = co.loaded<typeof Person, typeof personResolve>

let personNotesResolve = {
	notes: { $each: { $onError: "catch" } },
	inactiveNotes: { $each: { $onError: "catch" } },
} as const satisfies ResolveQuery<typeof Person>

let personRemindersResolve = {
	reminders: { $each: { $onError: "catch" } },
	inactiveReminders: { $each: { $onError: "catch" } },
} as const satisfies ResolveQuery<typeof Person>

async function preloadPerson(
	personId: string,
): Promise<{ person: LoadedPerson | null; loadingState: PersonLoadingState }> {
	let person = await Person.load(personId, { resolve: personResolve })
	if (!person.$isLoaded) {
		return {
			person: null,
			loadingState: person.$jazz.loadingState as "unauthorized" | "unavailable",
		}
	}
	return { person, loadingState: null }
}

function usePersonNotes(
	personId: string,
	searchQuery: string,
	statusFilter: NotesStatusFilter,
): co.loaded<typeof Note>[] {
	let person = useCoState(Person, personId, {
		resolve: personNotesResolve,
	})

	useEffect(() => {
		if (!person.$isLoaded) return
		removeDeletedCoValueRefs(person.notes)
		removeDeletedCoValueRefs(person.inactiveNotes)
	}, [person])

	let allNotes = [
		...getLoadedCoListValues<co.loaded<typeof Note>>(
			person.$isLoaded ? person.notes : undefined,
		),
		...getLoadedCoListValues<co.loaded<typeof Note>>(
			person.$isLoaded ? person.inactiveNotes : undefined,
		),
	]

	let searchLower = searchQuery.toLowerCase()

	let filtered = allNotes.filter(note => {
		let noteIsDeleted = isDeleted(note)
		let matchesStatus =
			statusFilter === "active" ? !noteIsDeleted : noteIsDeleted
		let matchesSearch =
			!searchLower || note.content.toLowerCase().includes(searchLower)
		return matchesStatus && matchesSearch
	})

	if (statusFilter === "active") {
		filtered.sort((a, b) => {
			let aTime = (a.createdAt || new Date(a.$jazz.createdAt)).getTime()
			let bTime = (b.createdAt || new Date(b.$jazz.createdAt)).getTime()
			return bTime - aTime
		})
	} else {
		filtered.sort((a, b) => {
			let aTime = a.deletedAt?.getTime() ?? 0
			let bTime = b.deletedAt?.getTime() ?? 0
			return bTime - aTime
		})
	}

	return filtered
}

function usePersonReminders(
	personId: string,
	searchQuery: string,
	statusFilter: RemindersStatusFilter,
): co.loaded<typeof Reminder>[] {
	let person = useCoState(Person, personId, {
		resolve: personRemindersResolve,
	})

	useEffect(() => {
		if (!person.$isLoaded) return
		removeDeletedCoValueRefs(person.reminders)
		removeDeletedCoValueRefs(person.inactiveReminders)
	}, [person])

	let allReminders = [
		...getLoadedCoListValues<co.loaded<typeof Reminder>>(
			person.$isLoaded ? person.reminders : undefined,
		),
		...getLoadedCoListValues<co.loaded<typeof Reminder>>(
			person.$isLoaded ? person.inactiveReminders : undefined,
		),
	]

	let searchLower = searchQuery.toLowerCase()

	let filtered = allReminders.filter(reminder => {
		let reminderIsDeleted = isDeleted(reminder)
		let reminderIsDone = reminder.done && !reminderIsDeleted
		let reminderIsActive = !reminder.done && !reminderIsDeleted

		let matchesStatus =
			statusFilter === "active"
				? reminderIsActive
				: statusFilter === "done"
					? reminderIsDone
					: reminderIsDeleted

		let matchesSearch =
			!searchLower || reminder.text.toLowerCase().includes(searchLower)
		return matchesStatus && matchesSearch
	})

	if (statusFilter === "active") {
		filtered.sort(
			(a, b) =>
				new Date(a.dueAtDate).getTime() - new Date(b.dueAtDate).getTime(),
		)
	} else if (statusFilter === "done") {
		filtered.sort((a, b) => {
			let aTime = (a.updatedAt || a.createdAt).getTime()
			let bTime = (b.updatedAt || b.createdAt).getTime()
			return bTime - aTime
		})
	} else {
		filtered.sort((a, b) => {
			let aTime = a.deletedAt?.getTime() ?? 0
			let bTime = b.deletedAt?.getTime() ?? 0
			return bTime - aTime
		})
	}

	return filtered
}

function usePersonHasDueReminders(personId: string): boolean {
	let person = useCoState(Person, personId, {
		resolve: personRemindersResolve,
	})
	if (!person.$isLoaded) return false
	return Array.from(person.reminders.values())
		.filter((r): r is co.loaded<typeof Reminder> => r != null && r.$isLoaded)
		.filter(r => !isDeleted(r) && !r.done)
		.some(r => isDueToday(r))
}
