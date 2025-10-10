import { tool, type InferUITool } from "ai"
import { z } from "zod"
import { Note, Person } from "#shared/schema/user"
import type { co } from "jazz-tools"
import { tryCatch } from "#shared/lib/trycatch"

export { addNoteTool, addNoteExecute, createNote }

export type { NoteData, NoteCreated }

async function createNote(
	personId: string,
	data: Omit<NoteData, "version" | "createdAt" | "updatedAt">,
): Promise<NoteCreated> {
	let person = await Person.load(personId, {
		resolve: { notes: { $each: true } },
	})

	if (!person) throw errors.PERSON_NOT_FOUND

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
		personID: personId,
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

let addNoteTool = tool({
	description: "Add a note to a person using their ID",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID"),
		title: z.string().describe("A short title for the note"),
		content: z.string().describe("The note content"),
		pinned: z
			.boolean()
			.optional()
			.describe("Whether to pin this note for prominent display"),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			noteId: z.string(),
			title: z.string(),
			content: z.string(),
			pinned: z.boolean(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	]),
})

type _AddNoteTool = InferUITool<typeof addNoteTool>

async function addNoteExecute(
	_userId: string,
	input: _AddNoteTool["input"],
): Promise<_AddNoteTool["output"]> {
	let res = await tryCatch(createNote(input.personId, input))
	if (!res.ok) return { error: `${res.error}` }
	let { data } = res
	return {
		noteId: data.noteID,
		personId: data.personID,
		title: data.current.title || "",
		content: data.current.content,
		pinned: data.current.pinned || false,
		createdAt: data.current.createdAt.toISOString(),
		updatedAt: data.current.updatedAt.toISOString(),
	}
}
