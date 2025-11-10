import { tool } from "ai"
import { z } from "zod"
import { co, type ResolveQuery } from "jazz-tools"
import {
	UserAccount,
	Person,
	Note,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"

export { listNotesTool, listNotesExecute }
export type { ListNotesResult }

let query = {
	root: {
		people: {
			$each: {
				notes: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

async function listNotes(options: {
	userId: string
	searchQuery?: string
}): Promise<ListNotesResult> {
	let userResult = await tryCatch(
		UserAccount.load(options.userId, { resolve: query }),
	)
	if (!userResult.ok) throw errors.USER_NOT_FOUND

	let user = userResult.data
	if (!user) throw errors.USER_NOT_FOUND

	let people = user.root?.people ?? []

	let notePairs: Array<{
		note: co.loaded<typeof Note>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of people) {
		if (!person) continue
		if (isPermanentlyDeleted(person) || isDeleted(person)) continue
		if (!person.notes) continue

		for (let note of person.notes) {
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

let errors = {
	USER_NOT_FOUND: "user not found",
} as const

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

let listNotesTool = tool({
	description:
		"List notes across all people with optional search on note content, titles, and person names.",
	inputSchema: z.object({
		searchQuery: z
			.string()
			.optional()
			.describe(
				"Optional query to filter notes by content, title, or person name",
			),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			operation: z.literal("list"),
			notes: z.array(
				z.object({
					id: z.string(),
					title: z.string(),
					content: z.string(),
					pinned: z.boolean(),
					deleted: z.boolean(),
					deletedAt: z.string().optional(),
					createdAt: z.string(),
					updatedAt: z.string(),
					person: z.object({
						id: z.string(),
						name: z.string(),
					}),
				}),
			),
			totalCount: z.number(),
			filteredCount: z.number(),
			searchQuery: z.string().optional(),
		}),
	]),
})

async function listNotesExecute(
	userId: string,
	input: { searchQuery?: string },
) {
	let result = await tryCatch(listNotes({ userId, ...input }))
	if (!result.ok) return { error: `${result.error}` }
	return result.data
}
