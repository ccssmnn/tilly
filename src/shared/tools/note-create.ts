import { tool } from "ai"
import { z } from "zod"
import { Note, Person, UserAccount } from "#shared/schema/user"
import type { co, Loaded } from "jazz-tools"
import { tryCatch } from "#shared/lib/trycatch"

export { createAddNoteTool, createNote }

export type { NoteData, NoteCreated }

async function createNote(
	data: Omit<NoteData, "version" | "createdAt" | "updatedAt">,
	options: {
		personId: string
		worker: Loaded<typeof UserAccount>
	},
): Promise<NoteCreated> {
	let person = await Person.load(options.personId, {
		resolve: { notes: { $each: true } },
		loadAs: options.worker,
	})

	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let now = new Date()
	let note = Note.create({
		version: 1,
		title: data.title,
		content: data.content,
		pinned: data.pinned || false,
		createdAt: now,
		updatedAt: now,
	})

	person.notes.$jazz.push(note)
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "create",
		noteID: note.$jazz.id,
		personID: options.personId,
		current: { ...note },
		_ref: note,
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	NOTE_NOT_FOUND: "note not found",
} as const

type NoteData = Parameters<typeof Note.create>[0]

type NoteCreated = {
	_ref: co.loaded<typeof Note>
	operation: "create"
	noteID: string
	personID: string
	current: NoteData
}

function createAddNoteTool(worker: Loaded<typeof UserAccount>) {
	return tool({
		description: "Add a note to a person using their ID",
		inputSchema: z.object({
			personId: z.string().describe("The person's ID"),
			title: z.string().describe("A short title for the note"),
			content: z
				.string()
				.describe("The note content. Supports markdown formatting."),
			pinned: z
				.boolean()
				.optional()
				.describe("Whether to pin this note for prominent display"),
		}),
		execute: async input => {
			let { personId, ...data } = input
			let res = await tryCatch(createNote(data, { personId, worker }))
			if (!res.ok) return { error: `${res.error}` }
			let result = res.data
			return {
				noteId: result.noteID,
				personId: result.personID,
				title: result.current.title || "",
				content: result.current.content,
				pinned: result.current.pinned || false,
				createdAt: result.current.createdAt.toISOString(),
				updatedAt: result.current.updatedAt.toISOString(),
			}
		},
	})
}
