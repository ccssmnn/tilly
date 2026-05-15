import { z } from "zod"
import { co } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import { Note, Person } from "#shared/schema/user"
import {
	defineTool,
	createdSchema,
	type Created,
	type Worker,
} from "#shared/tools/define-tool"

export { createNote, createAddNoteTool, noteCurrent }

let noteCurrent = z.object({
	noteId: z.string(),
	personId: z.string(),
	title: z.string().optional(),
	content: z.string(),
	pinned: z.boolean(),
	imageCount: z.number().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	deletedAt: z.string().optional(),
})

type NoteCurrent = z.infer<typeof noteCurrent>

let createNoteInput = z.object({
	personId: z.string().describe("The person's ID"),
	title: z.string().optional().describe("A short title for the note"),
	content: z
		.string()
		.describe("The note content. Supports markdown formatting."),
	pinned: z
		.boolean()
		.optional()
		.describe("Whether to pin this note for prominent display"),
})

type CreateNoteInput = z.infer<typeof createNoteInput> & {
	imageFiles?: File[]
}

async function createNote(
	worker: Worker,
	input: CreateNoteInput,
): Promise<Created<NoteCurrent>> {
	let person = await Person.load(input.personId, {
		resolve: { notes: { $each: true } },
		loadAs: worker,
	})
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let now = new Date()
	let note = Note.create(
		{
			version: 1,
			title: input.title,
			content: input.content,
			pinned: input.pinned ?? false,
			createdAt: now,
			updatedAt: now,
		},
		person.$jazz.owner,
	)

	if (input.imageFiles && input.imageFiles.length > 0) {
		let imageList = co.list(co.image()).create([], person.$jazz.owner)
		for (let file of input.imageFiles.slice(0, 10)) {
			let image = await createImage(file, {
				owner: person.$jazz.owner,
				maxSize: 2048,
				placeholder: "blur",
				progressive: true,
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			imageList.$jazz.push(image as any)
		}
		note.$jazz.set("images", imageList)
		note.$jazz.set("imageCount", imageList.length)
	}

	person.notes.$jazz.push(note)
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "create",
		current: {
			noteId: note.$jazz.id,
			personId: input.personId,
			title: note.title,
			content: note.content,
			pinned: note.pinned ?? false,
			imageCount: note.imageCount,
			createdAt: note.createdAt.toISOString(),
			updatedAt: note.updatedAt.toISOString(),
			deletedAt: note.deletedAt?.toISOString(),
		},
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
} as const

let createAddNoteTool = defineTool({
	description: "Add a note to a person using their ID",
	input: createNoteInput,
	output: createdSchema(noteCurrent),
	serverOp: createNote,
})
