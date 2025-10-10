import { tool, type InferUITool } from "ai"
import { z } from "zod"
import { Note, Person } from "#shared/schema/user"
import type { co } from "jazz-tools"
import { tryCatch } from "#shared/lib/trycatch"

export {
	editNoteTool,
	editNoteExecute,
	deleteNoteTool,
	deleteNoteExecute,
	updateNote,
}

export type { NoteData, NoteUpdated }

async function updateNote(
	personId: string,
	noteId: string,
	updates: Partial<
		Pick<NoteData, "title" | "content" | "pinned"> & {
			deletedAt: Date | string | undefined
			permanentlyDeletedAt: Date | string | undefined
		}
	>,
): Promise<NoteUpdated> {
	let person = await Person.load(personId)
	if (!person) throw errors.PERSON_NOT_FOUND

	let note = await Note.load(noteId)
	if (!note) throw errors.NOTE_NOT_FOUND

	let previous = { ...note }

	if (updates.title !== undefined) {
		note.$jazz.set("title", updates.title)
	}
	if (updates.content !== undefined) {
		note.$jazz.set("content", updates.content)
	}
	if (updates.pinned !== undefined) {
		note.$jazz.set("pinned", updates.pinned)
	}

	if ("deletedAt" in updates && updates.deletedAt === undefined) {
		note.$jazz.delete("deletedAt")
	}

	if (updates.deletedAt !== undefined) {
		note.$jazz.set("deletedAt", new Date(updates.deletedAt))
	}

	if (updates.permanentlyDeletedAt !== undefined) {
		note.$jazz.set(
			"permanentlyDeletedAt",
			new Date(updates.permanentlyDeletedAt),
		)
	}

	note.$jazz.set("updatedAt", new Date())
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "update",
		noteID: noteId,
		personID: personId,
		current: { ...note },
		previous,
		_ref: note,
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	NOTE_NOT_FOUND: "note not found",
} as const

type NoteData = Parameters<typeof Note.create>[0]

type NoteUpdated = {
	_ref: co.loaded<typeof Note>
	operation: "update"
	noteID: string
	personID: string
	current: NoteData
	previous: NoteData
}

let editNoteTool = tool({
	description: "Edit a note by ID",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID who owns the note"),
		noteId: z.string().describe("The note's ID"),
		title: z.string().optional().describe("Updated title"),
		content: z.string().optional().describe("The updated note content"),
		pinned: z
			.boolean()
			.optional()
			.describe(
				"Whether the note should be pinned. Pinned notes appear at the top of the note list.",
			),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			noteId: z.string(),
			title: z.string().optional(),
			content: z.string(),
			pinned: z.boolean().optional(),
			deletedAt: z.string().optional(),
			createdAt: z.string(),
			updatedAt: z.string(),
			previous: z
				.object({
					title: z.string().optional(),
					content: z.string(),
					pinned: z.boolean().optional(),
					deletedAt: z.string().optional(),
					createdAt: z.string().optional(),
					updatedAt: z.string().optional(),
				})
				.optional(),
		}),
	]),
})

type _EditNoteTool = InferUITool<typeof editNoteTool>

async function editNoteExecute(
	_userId: string,
	input: _EditNoteTool["input"],
): Promise<_EditNoteTool["output"]> {
	let { personId, noteId, ...updates } = input

	let res = await tryCatch(updateNote(personId, noteId, updates))
	if (!res.ok) return { error: `${res.error}` }
	let { _ref: _unused, ...result } = res.data // eslint-disable-line @typescript-eslint/no-unused-vars
	return {
		personId: result.personID,
		noteId: result.noteID,
		title: result.current.title,
		content: result.current.content,
		pinned: result.current.pinned,
		deletedAt: result.current.deletedAt?.toISOString(),
		createdAt: result.current.createdAt.toISOString(),
		updatedAt: result.current.updatedAt.toISOString(),
		previous: {
			title: result.previous.title,
			content: result.previous.content,
			pinned: result.previous.pinned,
			deletedAt: result.current.deletedAt?.toISOString(),
			createdAt: result.previous.createdAt.toISOString(),
			updatedAt: result.previous.updatedAt.toISOString(),
		},
	}
}

let deleteNoteTool = tool({
	description: "Delete a note by ID",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID who owns the note"),
		noteId: z.string().describe("The note's ID"),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			noteId: z.string(),
			title: z.string().optional(),
			content: z.string(),
			pinned: z.boolean().optional(),
			deletedAt: z.string().optional(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	]),
})

type _DeleteNoteTool = InferUITool<typeof deleteNoteTool>

async function deleteNoteExecute(
	_userId: string,
	input: _DeleteNoteTool["input"],
): Promise<_DeleteNoteTool["output"]> {
	let { personId, noteId } = input

	let res = await tryCatch(
		updateNote(personId, noteId, { deletedAt: new Date() }),
	)
	if (!res.ok) return { error: `${res.error}` }
	let { _ref: _unused2, ...result } = res.data // eslint-disable-line @typescript-eslint/no-unused-vars
	return {
		personId: result.personID,
		noteId: result.noteID,
		title: result.current.title,
		content: result.current.content,
		pinned: result.current.pinned,
		deletedAt: result.current.deletedAt?.toISOString(),
		createdAt: result.current.createdAt.toISOString(),
		updatedAt: result.current.updatedAt.toISOString(),
	}
}
