import {
	Person,
	isDeleted,
	isPermanentlyDeleted,
	UserAccount,
	sortByDeletedAt,
	sortByCreatedAt,
} from "#shared/schema/user"
import { useAccount, useCoState } from "jazz-tools/react-core"
import { co, type ResolveQuery } from "jazz-tools"

export {
	usePersonNotes,
	useNotes,
	type NotesLoadedAccount,
	type PersonNotesLoadedPerson,
}

let notesResolve = {
	root: {
		people: { $each: { notes: { $each: { images: { $each: true } } } } },
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let personNotesResolve = {
	notes: { $each: { images: { $each: true } } },
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
	let notes = useCoState(Person, personId, {
		resolve: personNotesResolve,
		select: person => {
			if (!person.$isLoaded) {
				if (defaultPerson && defaultPerson.$jazz.id === personId) {
					return defaultPerson.notes.filter(n => !isPermanentlyDeleted(n))
				}
				return []
			}
			return person.notes.filter(n => !isPermanentlyDeleted(n))
		},
	})

	let filteredNotes = searchQuery
		? notes.filter(note => {
				let searchLower = searchQuery.toLowerCase()
				return note.content.toLowerCase().includes(searchLower)
			})
		: notes

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
	let people = useAccount(UserAccount, {
		resolve: notesResolve,
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

	let allNotePairs = []

	for (let person of people) {
		for (let note of person.notes.values()) {
			if (isPermanentlyDeleted(note)) continue
			allNotePairs.push({ note, person })
		}
	}

	let filteredPairs = searchQuery
		? allNotePairs.filter(({ note, person }) => {
				let searchLower = searchQuery.toLowerCase()
				return (
					note.content.toLowerCase().includes(searchLower) ||
					person.name.toLowerCase().includes(searchLower)
				)
			})
		: allNotePairs

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
