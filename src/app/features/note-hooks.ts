import { Person, Note, isDeleted, UserAccount } from "#shared/schema/user"
import { useAccount, useCoState } from "jazz-tools/react-core"
import { co, type ResolveQuery } from "jazz-tools"
import { useEffect } from "react"
import {
	filterNotes,
	filterPersonNotes,
	type NotesFilterOptions,
	type PersonNotesFilterOptions,
} from "#app/features/note-filters"
import {
	getLoadedCoListValues,
	removeDeletedCoValueRefs,
} from "#shared/lib/co-list-utils"

export {
	useNotes,
	usePersonNotes,
	type NotesLoadedAccount,
	type PersonNotesLoadedPerson,
	type NotePair,
}

let notesResolve = {
	root: {
		people: {
			$each: {
				notes: { $each: { $onError: "catch" } },
				inactiveNotes: { $each: { $onError: "catch" } },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let personNotesResolve = {
	notes: { $each: { $onError: "catch" } },
	inactiveNotes: { $each: { $onError: "catch" } },
} as const satisfies ResolveQuery<typeof Person>

type NotesLoadedAccount = co.loaded<typeof UserAccount, typeof notesResolve>
type PersonNotesLoadedPerson = co.loaded<
	typeof Person,
	typeof personNotesResolve
>

type NotePair = {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
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
			.filter(p => !isDeleted(p)) ?? []

	let allNotePairs: NotePair[] = []

	for (let person of people) {
		for (let note of person.notes.values()) {
			if (!note.$isLoaded) continue
			allNotePairs.push({ note, person })
		}

		if (person.inactiveNotes?.$isLoaded) {
			for (let note of person.inactiveNotes.values()) {
				if (!note?.$isLoaded) continue
				allNotePairs.push({ note, person })
			}
		}
	}

	return filterNotes(allNotePairs, searchQuery, options)
}

function usePersonNotes(
	personId: string,
	searchQuery: string,
	defaultPerson?: PersonNotesLoadedPerson,
	options?: PersonNotesFilterOptions,
): co.loaded<typeof Note>[] {
	let person = useCoState(Person, personId, {
		resolve: personNotesResolve,
	})

	useEffect(() => {
		if (!person.$isLoaded) return
		removeDeletedCoValueRefs(person.notes)
		removeDeletedCoValueRefs(person.inactiveNotes)
	}, [person])

	let loadedPerson = person.$isLoaded ? person : defaultPerson

	let allNotes = [
		...getLoadedCoListValues<co.loaded<typeof Note>>(loadedPerson?.notes),
		...getLoadedCoListValues<co.loaded<typeof Note>>(
			loadedPerson?.inactiveNotes,
		),
	]

	return filterPersonNotes(allNotes, searchQuery, options)
}
