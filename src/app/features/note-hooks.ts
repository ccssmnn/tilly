import {
	Person,
	Note,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"

export { usePersonNotes, useNotes }

function usePersonNotes<Q extends ResolveQuery<typeof Person>>(
	person: co.loaded<typeof Person, Q>,
	searchQuery: string,
) {
	if (!person.notes.$isLoaded) return { active: [], deleted: [] }

	let filteredNotes = searchQuery
		? person.notes.filter(note => {
				if (!note.$isLoaded || isPermanentlyDeleted(note)) return false
				let searchLower = searchQuery.toLowerCase()
				return note.content.toLowerCase().includes(searchLower)
			})
		: person.notes.filter(note => note.$isLoaded && !isPermanentlyDeleted(note))

	let active: Array<{
		type: "note"
		item: co.loaded<typeof Note>
		timestamp: Date
		priority: "high" | "normal"
	}> = []

	let deleted: Array<{
		type: "note"
		item: co.loaded<typeof Note>
		timestamp: Date
		priority: "high" | "normal"
	}> = []

	filteredNotes.forEach(note => {
		if (!note.$isLoaded) return

		let item = {
			type: "note" as const,
			item: note,
			timestamp: note.createdAt || new Date(note.$jazz.createdAt),
			priority: note.pinned ? ("high" as const) : ("normal" as const),
		}

		if (isDeleted(note) && !isPermanentlyDeleted(note)) {
			deleted.push(item)
		} else if (!isDeleted(note)) {
			active.push(item)
		}
	})

	sortByPriorityAndDate(active)
	deleted.sort((a, b) => {
		let aTime = a.item.deletedAt?.getTime() ?? a.timestamp.getTime()
		let bTime = b.item.deletedAt?.getTime() ?? b.timestamp.getTime()
		return bTime - aTime
	})

	return { active, deleted }
}

function sortByPriorityAndDate(
	arr: Array<{
		priority: "high" | "normal"
		timestamp: Date
	}>,
) {
	return arr.sort((a, b) => {
		if (a.priority === "high" && b.priority !== "high") return -1
		if (b.priority === "high" && a.priority !== "high") return 1
		return b.timestamp.getTime() - a.timestamp.getTime()
	})
}

function useNotes<Q extends ResolveQuery<typeof Person>>(
	people: Array<co.loaded<typeof Person, Q>>,
	searchQuery: string,
) {
	let allNotePairs: Array<{
		note: co.loaded<typeof Note>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of people) {
		if (isPermanentlyDeleted(person) || isDeleted(person)) continue
		if (!person.notes.$isLoaded) continue

		for (let note of person.notes.values()) {
			if (!note.$isLoaded || isPermanentlyDeleted(note)) continue
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

	let active: typeof allNotePairs = []
	let deleted: typeof allNotePairs = []

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
