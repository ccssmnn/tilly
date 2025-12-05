import {
	Person,
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
}

let notesResolve = {
	root: {
		people: {
			$each: { notes: { $each: true }, inactiveNotes: { $each: true } },
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

function useNotes(searchQuery: string, defaultAccount?: NotesLoadedAccount) {
	let account = useAccount(UserAccount, {
		resolve: notesResolve,
	})

	let loadedAccount = account.$isLoaded ? account : defaultAccount
	let people = loadedAccount?.root.people.filter(p => !isDeleted(p)) ?? []

	let allNotePairs = []

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
	let listFilter = extractListFilterFromQuery(searchLower)
	let searchWithoutFilter = searchLower.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()

	let filteredPairs = allNotePairs.filter(({ note, person }) => {
		let matchesSearch =
			!searchWithoutFilter ||
			note.content.toLowerCase().includes(searchWithoutFilter) ||
			person.name.toLowerCase().includes(searchWithoutFilter)

		let matchesFilter = !listFilter || hasHashtag(person, listFilter)

		return matchesSearch && matchesFilter
	})

	let active = []
	let deleted = []

	for (let { note, person } of filteredPairs) {
		if (isDeleted(note) && !isPermanentlyDeleted(note)) {
			deleted.push({ note, person })
		} else if (!isDeleted(note)) {
			active.push({ note, person })
		}
	}

	active.sort((a, b) => {
		let aTime = (a.note.createdAt || new Date(a.note.$jazz.createdAt)).getTime()
		let bTime = (b.note.createdAt || new Date(b.note.$jazz.createdAt)).getTime()
		return bTime - aTime
	})

	deleted.sort((a, b) => {
		let aTime =
			a.note.deletedAt?.getTime() ??
			(a.note.createdAt || new Date(a.note.$jazz.createdAt)).getTime()
		let bTime =
			b.note.deletedAt?.getTime() ??
			(b.note.createdAt || new Date(b.note.$jazz.createdAt)).getTime()
		return bTime - aTime
	})

	return { active, deleted, total: allNotePairs.length }
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
