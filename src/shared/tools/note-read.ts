import { z } from "zod"
import { co } from "jazz-tools"
import { Person, Note, isDeleted } from "#shared/schema/user"
import { defineTool, type Worker } from "#shared/tools/define-tool"

export { listNotes, createListNotesTool }

let noteSummary = z.object({
	id: z.string(),
	title: z.string(),
	content: z.string(),
	pinned: z.boolean(),
	deleted: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	deletedAt: z.string().optional(),
	person: z.object({
		id: z.string(),
		name: z.string(),
	}),
})

let listNotesOutput = z.object({
	operation: z.literal("list"),
	notes: z.array(noteSummary),
	totalCount: z.number(),
	filteredCount: z.number(),
	searchQuery: z.string().optional(),
})

let listNotesInput = z.object({
	searchQuery: z
		.string()
		.optional()
		.describe(
			"Optional query to filter notes by content, title, or person name",
		),
	includeDeleted: z.boolean().optional(),
})

async function listNotes(
	worker: Worker,
	input: z.infer<typeof listNotesInput>,
): Promise<z.infer<typeof listNotesOutput>> {
	let user = await worker.$jazz.ensureLoaded({
		resolve: {
			root: {
				people: {
					$each: { notes: { $each: true }, inactiveNotes: { $each: true } },
				},
			},
		},
	})

	let notePairs: Array<{
		note: co.loaded<typeof Note>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of user.root.people.values()) {
		if (!person) continue
		if (isDeleted(person)) continue

		if (person.notes) {
			for (let note of person.notes.values()) {
				if (!note) continue
				if (!input.includeDeleted && isDeleted(note)) continue
				notePairs.push({ note, person })
			}
		}

		if (person.inactiveNotes && input.includeDeleted) {
			for (let note of person.inactiveNotes.values()) {
				if (!note) continue
				notePairs.push({ note, person })
			}
		}
	}

	let filteredPairs = notePairs
	if (input.searchQuery) {
		let searchLower = input.searchQuery.toLowerCase()
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
		notes: orderedPairs.map(({ note, person }) => ({
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
		})),
		totalCount: notePairs.length,
		filteredCount: filteredPairs.length,
		...(input.searchQuery && { searchQuery: input.searchQuery }),
	}
}

let createListNotesTool = defineTool({
	description:
		"List notes across all people with optional search on note content, titles, and person names. Note content supports markdown formatting.",
	input: listNotesInput,
	output: listNotesOutput,
	serverOp: listNotes,
})
