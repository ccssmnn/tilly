import {
	isDeleted,
	sortByDeletedAt,
	sortByCreatedAt,
} from "#shared/schema/user"
import { hasHashtag } from "#app/features/list-utilities"

export { filterNotes, filterPersonNotes, extractSearchWithoutFilter }
export type { NotesFilterOptions, PersonNotesFilterOptions }

type NotesFilterOptions = {
	listFilter: string | null
	statusFilter: "active" | "deleted"
}

type NoteLike = {
	content: string
	pinned?: boolean
	deletedAt?: Date
	createdAt?: Date
	$jazz: { createdAt: number; lastUpdatedAt: number }
}

type PersonLike = {
	name: string
	summary?: string
}

type NotePairLike<N extends NoteLike, P extends PersonLike> = {
	note: N
	person: P
}

function filterNotes<
	N extends NoteLike,
	P extends PersonLike,
	Pair extends NotePairLike<N, P>,
>(
	allNotePairs: Pair[],
	searchQuery: string,
	options?: NotesFilterOptions,
): { notes: Pair[]; total: number } {
	let searchLower = searchQuery.toLowerCase()
	let listFilter = options?.listFilter ?? null
	let statusFilter = options?.statusFilter ?? "active"

	let filteredPairs = allNotePairs.filter(({ note, person }) => {
		let matchesSearch =
			!searchLower ||
			note.content.toLowerCase().includes(searchLower) ||
			person.name.toLowerCase().includes(searchLower)

		let matchesListFilter = !listFilter || hasHashtag(person, listFilter)

		let noteIsDeleted = isDeleted(note)
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

type PersonNotesFilterOptions = {
	statusFilter: "active" | "deleted"
}

function filterPersonNotes<N extends NoteLike>(
	allNotes: N[],
	searchQuery: string,
	options?: PersonNotesFilterOptions,
): N[] {
	let searchLower = searchQuery.toLowerCase()
	let statusFilter = options?.statusFilter ?? "active"

	let filteredNotes = allNotes.filter(note => {
		let matchesSearch =
			!searchLower || note.content.toLowerCase().includes(searchLower)

		let noteIsDeleted = isDeleted(note)
		let noteIsActive = !isDeleted(note)

		let matchesStatusFilter =
			statusFilter === "active" ? noteIsActive : noteIsDeleted

		return matchesSearch && matchesStatusFilter
	})

	if (statusFilter === "active") {
		sortByCreatedAt(filteredNotes)
		filteredNotes = [
			...filteredNotes.filter(n => n.pinned),
			...filteredNotes.filter(n => !n.pinned),
		]
	} else {
		sortByDeletedAt(filteredNotes)
	}

	return filteredNotes
}

function extractSearchWithoutFilter(query: string): string {
	return query
		.toLowerCase()
		.replace(/^#[a-zA-Z0-9_]+\s*/, "")
		.trim()
}
