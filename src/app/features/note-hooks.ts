import {
	Person,
	Note,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"

export { usePersonNotes }

function usePersonNotes<Q extends ResolveQuery<typeof Person>>(
	person: co.loaded<typeof Person, Q>,
	searchQuery: string,
) {
	if (!person.notes) return { active: [], deleted: [] }

	let filteredNotes = searchQuery
		? person.notes.filter(note => {
				if (!note || isPermanentlyDeleted(note)) return false
				let searchLower = searchQuery.toLowerCase()
				return note.content.toLowerCase().includes(searchLower)
			})
		: person.notes.filter(note => note && !isPermanentlyDeleted(note))

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
		if (!note) return

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
