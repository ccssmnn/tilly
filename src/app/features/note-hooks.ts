import {
	Person,
	Note,
	isDeleted,
	isPermanentlyDeleted,
	UserAccount,
	sortByDeletedAt,
	sortByCreatedAt,
} from "#shared/schema/user"
import { hasHashtag } from "#app/features/list-utilities"
import { useAccount, useCoState } from "jazz-tools/react-core"
import { co, type ResolveQuery } from "jazz-tools"

export {
	usePersonNotes,
	useNotes,
	extractSearchWithoutFilter,
	type NotesLoadedAccount,
	type PersonNotesLoadedPerson,
	type NotePair,
}

type NotePair = {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
}

let notesResolve = {
	root: {
		people: {
			$each: {
				notes: { $each: true },
				inactiveNotes: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let personNotesResolve = {
	notes: { $each: true },
	inactiveNotes: { $each: true },
} as const satisfies ResolveQuery<typeof Person>

type NotesLoadedAccount = co.loaded<typeof UserAccount, typeof notesResolve>
type PersonNotesLoadedPerson = co.loaded<
	typeof Person,
	typeof personNotesResolve
>

function usePersonNotes(
	personId: string,
	searchQuery: string,
	defaultPerson?: PersonNotesLoadedPerson,
) {
	let person = useCoState(Person, personId, {
		resolve: personNotesResolve,
	})

	let loadedPerson = person.$isLoaded ? person : defaultPerson

	let allNotes = [
		...(loadedPerson?.notes?.filter(n => !isPermanentlyDeleted(n)) ?? []),
		...(loadedPerson?.inactiveNotes?.filter(n => !isPermanentlyDeleted(n)) ??
			[]),
	]

	let filteredNotes = searchQuery
		? allNotes.filter(note =>
				note.content.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: allNotes

	let active = []
	let deleted = []

	for (let note of filteredNotes) {
		if (isDeleted(note) && !isPermanentlyDeleted(note)) {
			deleted.push(note)
		} else if (!isDeleted(note)) {
			active.push(note)
		}
	}

	sortByCreatedAt(active)
	active = [...active.filter(n => n.pinned), ...active.filter(n => !n.pinned)]

	sortByDeletedAt(deleted)

	return { active, deleted }
}

type NotesFilterOptions = {
	listFilter: string | null
	statusFilter: "active" | "deleted"
}

function useNotes(
	searchQuery: string,
	defaultAccount?: NotesLoadedAccount,
	options?: NotesFilterOptions,
): { notes: NotePair[]; total: number } {
	let account = useAccount(UserAccount, {
		resolve: notesResolve,
	})

	let loadedAccount = account.$isLoaded ? account : defaultAccount
	let people =
		loadedAccount?.root.people
			.filter(p => p.$isLoaded)
			.filter(p => !isDeleted(p) && !isPermanentlyDeleted(p)) ?? []

	let allNotePairs: NotePair[] = []

	for (let person of people) {
		for (let note of person.notes.values()) {
			if (isPermanentlyDeleted(note)) continue
			allNotePairs.push({ note, person })
		}

		if (person.inactiveNotes?.$isLoaded) {
			for (let note of person.inactiveNotes.values()) {
				if (!note || isPermanentlyDeleted(note)) continue
				allNotePairs.push({ note, person })
			}
		}
	}

	let searchLower = searchQuery.toLowerCase()
	let listFilter = options?.listFilter ?? null
	let statusFilter = options?.statusFilter ?? "active"

	let filteredPairs = allNotePairs.filter(({ note, person }) => {
		let matchesSearch =
			!searchLower ||
			note.content.toLowerCase().includes(searchLower) ||
			person.name.toLowerCase().includes(searchLower)

		let matchesListFilter = !listFilter || hasHashtag(person, listFilter)

		let noteIsDeleted = isDeleted(note) && !isPermanentlyDeleted(note)
		let noteIsActive = !isDeleted(note)

		let matchesStatusFilter =
			statusFilter === "active" ? noteIsActive : noteIsDeleted

		return matchesSearch && matchesListFilter && matchesStatusFilter
	})

	// Sort based on status
	if (statusFilter === "active") {
		filteredPairs.sort((a, b) => {
			let aTime = (
				a.note.createdAt || new Date(a.note.$jazz.createdAt)
			).getTime()
			let bTime = (
				b.note.createdAt || new Date(b.note.$jazz.createdAt)
			).getTime()
			return bTime - aTime
		})
	} else {
		filteredPairs.sort((a, b) => {
			let aTime =
				a.note.deletedAt?.getTime() ??
				(a.note.createdAt || new Date(a.note.$jazz.createdAt)).getTime()
			let bTime =
				b.note.deletedAt?.getTime() ??
				(b.note.createdAt || new Date(b.note.$jazz.createdAt)).getTime()
			return bTime - aTime
		})
	}

	return { notes: filteredPairs, total: allNotePairs.length }
}

function extractSearchWithoutFilter(query: string): string {
	return query
		.toLowerCase()
		.replace(/^#[a-zA-Z0-9_]+\s*/, "")
		.trim()
}
