import { UserAccount, Person, Note, isDeleted } from "#shared/schema/user"
import { useAccount } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"
import { hasHashtag } from "#app/features/people"

export { preloadNotesWithPeople, useNotesData, type NotesData, type NotePair }

let resolve = {
	root: {
		people: {
			$each: {
				avatar: true,
				notes: { $each: { $onError: "catch" } },
				inactiveNotes: { $each: { $onError: "catch" } },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAccount = co.loaded<typeof UserAccount, typeof resolve>

type NotePair = {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
}

type StatusFilter = "active" | "deleted"

type NotesData = {
	notes: NotePair[]
	people: co.loaded<typeof Person>[]
	total: number
}

async function preloadNotesWithPeople(
	accountId: string,
): Promise<LoadedAccount> {
	let me = await UserAccount.load(accountId, { resolve })
	if (!me.$isLoaded) throw new Error("Failed to load account")
	return me
}

function useNotesData(
	fallback: LoadedAccount,
	options?: {
		query?: string
		statusFilter?: StatusFilter
		listFilter?: string | null
	},
): NotesData {
	let subscribed = useAccount(UserAccount, { resolve })
	let me = subscribed.$isLoaded ? subscribed : fallback
	let searchLower = (options?.query ?? "").toLowerCase()
	let statusFilter = options?.statusFilter ?? "active"
	let listFilter = options?.listFilter ?? null

	let people = me.root.people
		.filter(p => p.$isLoaded)
		.filter(p => !isDeleted(p))

	let all: NotePair[] = []
	for (let person of people) {
		for (let note of person.notes.values()) {
			if (!note.$isLoaded) continue
			all.push({ note, person })
		}
		if (person.inactiveNotes?.$isLoaded) {
			for (let note of person.inactiveNotes.values()) {
				if (!note?.$isLoaded) continue
				all.push({ note, person })
			}
		}
	}

	let filtered = all.filter(({ note, person }) => {
		let noteIsDeleted = isDeleted(note)
		let noteIsActive = !noteIsDeleted

		let matchesStatus = statusFilter === "active" ? noteIsActive : noteIsDeleted

		let matchesList = !listFilter || hasHashtag(person, listFilter)

		let matchesSearch =
			!searchLower ||
			note.content.toLowerCase().includes(searchLower) ||
			person.name.toLowerCase().includes(searchLower)

		return matchesStatus && matchesList && matchesSearch
	})

	if (statusFilter === "active") {
		filtered.sort((a, b) => {
			let aTime = (
				a.note.createdAt || new Date(a.note.$jazz.createdAt)
			).getTime()
			let bTime = (
				b.note.createdAt || new Date(b.note.$jazz.createdAt)
			).getTime()
			return bTime - aTime
		})
	} else {
		filtered.sort((a, b) => {
			let aTime = a.note.deletedAt?.getTime() ?? 0
			let bTime = b.note.deletedAt?.getTime() ?? 0
			return bTime - aTime
		})
	}

	return { notes: filtered, people, total: all.length }
}
