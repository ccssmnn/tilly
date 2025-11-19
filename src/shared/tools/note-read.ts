import { tool } from "ai"
import { z } from "zod"
import { co, type Loaded } from "jazz-tools"
import {
	UserAccount,
	Person,
	Note,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"

export { createListNotesTool }
export type { ListNotesResult }

async function listNotes(
	options: { searchQuery?: string },
	worker: Loaded<typeof UserAccount>,
): Promise<ListNotesResult> {
	let user = await worker.$jazz.ensureLoaded({
		resolve: { root: { people: { $each: { notes: { $each: true } } } } },
	})

	let notePairs: Array<{
		note: co.loaded<typeof Note>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of user.root.people.values()) {
		if (!person) continue
		if (isPermanentlyDeleted(person) || isDeleted(person)) continue
		if (!person.notes) continue

		for (let note of person.notes.values()) {
			if (!note) continue
			if (isPermanentlyDeleted(note)) continue
			notePairs.push({ note, person })
		}
	}

	let filteredPairs = notePairs
	if (options.searchQuery) {
		let searchLower = options.searchQuery.toLowerCase()
		filteredPairs = notePairs.filter(({ note, person }) => {
			let noteContent = note.content.toLowerCase()
			let noteTitle = (note.title || "").toLowerCase()
			let personName = person.name.toLowerCase()
			return (
				noteContent.includes(searchLower) ||
				noteTitle.includes(searchLower) ||
				personName.includes(searchLower)
			)
		})
	}

	let activePairs = filteredPairs
		.filter(({ note }) => !isDeleted(note))
		.sort((a, b) => {
			let aTime =
				a.note.createdAt?.getTime() ??
				new Date(a.note.$jazz.createdAt).getTime()
			let bTime =
				b.note.createdAt?.getTime() ??
				new Date(b.note.$jazz.createdAt).getTime()
			if (a.note.pinned && !b.note.pinned) return -1
			if (b.note.pinned && !a.note.pinned) return 1
			return bTime - aTime
		})

	let deletedPairs = filteredPairs
		.filter(({ note }) => isDeleted(note))
		.sort((a, b) => {
			let aTime =
				a.note.deletedAt?.getTime() ??
				a.note.createdAt?.getTime() ??
				new Date(a.note.$jazz.createdAt).getTime()
			let bTime =
				b.note.deletedAt?.getTime() ??
				b.note.createdAt?.getTime() ??
				new Date(b.note.$jazz.createdAt).getTime()
			return bTime - aTime
		})

	let orderedPairs = [...activePairs, ...deletedPairs]

	return {
		operation: "list",
		notes: orderedPairs.map(toNotePayload),
		totalCount: notePairs.length,
		filteredCount: filteredPairs.length,
		...(options.searchQuery && { searchQuery: options.searchQuery }),
	}
}

function toNotePayload({
	note,
	person,
}: {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
}): NoteSummary {
	return {
		id: note.$jazz.id,
		title: note.title || "",
		content: note.content,
		pinned: note.pinned || false,
		deleted: isDeleted(note),
		deletedAt: note.deletedAt?.toISOString(),
		createdAt: note.createdAt.toISOString(),
		updatedAt: note.updatedAt.toISOString(),
		person: {
			id: person.$jazz.id,
			name: person.name,
		},
	}
}

type NoteSummary = {
	id: string
	title: string
	content: string
	pinned: boolean
	deleted: boolean
	createdAt: string
	updatedAt: string
	deletedAt?: string
	person: {
		id: string
		name: string
	}
}

type ListNotesResult = {
	operation: "list"
	notes: Array<NoteSummary>
	totalCount: number
	filteredCount: number
	searchQuery?: string
}

function createListNotesTool(worker: Loaded<typeof UserAccount>) {
	return tool({
		description:
			"List notes across all people with optional search on note content, titles, and person names. Note content supports markdown formatting.",
		inputSchema: z.object({
			searchQuery: z
				.string()
				.optional()
				.describe(
					"Optional query to filter notes by content, title, or person name",
				),
		}),
		execute: async input => {
			let result = await tryCatch(listNotes(input, worker))
			if (!result.ok) return { error: `${result.error}` }
			return result.data
		},
	})
}
