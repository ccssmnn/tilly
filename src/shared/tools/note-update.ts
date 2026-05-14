import { z } from "zod"
import { co } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import { Note, Person } from "#shared/schema/user"
import {
	defineTool,
	updatedSchema,
	type Updated,
	type Worker,
} from "#shared/tools/define-tool"
import { noteCurrent } from "#shared/tools/note-create"

export { updateNote, createEditNoteTool, createDeleteNoteTool }

type NoteCurrent = z.infer<typeof noteCurrent>

let editNoteInput = z.object({
	personId: z.string().describe("The person's ID who owns the note"),
	noteId: z.string().describe("The note's ID"),
	title: z.string().optional().describe("Updated title"),
	content: z
		.string()
		.optional()
		.describe("The updated note content. Supports markdown formatting."),
	pinned: z
		.boolean()
		.optional()
		.describe(
			"Whether the note should be pinned. Pinned notes appear at the top of the note list.",
		),
	createdAt: z
		.string()
		.optional()
		.describe("Updated creation date (date string)"),
})

type UpdateNoteInput = z.infer<typeof editNoteInput> & {
	deletedAt?: Date | string | undefined
	imageFiles?: File[]
	removedImageIds?: string[]
}

async function updateNote(
	worker: Worker,
	input: UpdateNoteInput,
): Promise<Updated<NoteCurrent>> {
	let person = await Person.load(input.personId, {
		resolve: { notes: true, inactiveNotes: true },
		loadAs: worker,
	})
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	if (!person.inactiveNotes) {
		person.$jazz.set(
			"inactiveNotes",
			co.list(Note).create([], person.$jazz.owner),
		)
	}

	let note = await Note.load(input.noteId, {
		resolve: { images: { $each: true } },
		loadAs: worker,
	})
	if (!note.$isLoaded) throw errors.NOTE_NOT_FOUND

	let previous: NoteCurrent = serializeNote(note, input.personId)

	if (input.title !== undefined) {
		note.$jazz.set("title", input.title)
	}
	if (input.content !== undefined) {
		note.$jazz.set("content", input.content)
	}
	if (input.pinned !== undefined) {
		note.$jazz.set("pinned", input.pinned)
	}

	if (input.createdAt !== undefined) {
		let createdDate = new Date(input.createdAt)
		let now = new Date()
		createdDate.setHours(
			now.getHours(),
			now.getMinutes(),
			now.getSeconds(),
			now.getMilliseconds(),
		)
		note.$jazz.set("createdAt", createdDate)
	}

	if (input.imageFiles !== undefined || input.removedImageIds !== undefined) {
		let imageList = co.list(co.image()).create([])

		if (note.images?.$isLoaded) {
			let removedIds = new Set(input.removedImageIds ?? [])
			for (let existingImage of note.images.values()) {
				if (existingImage && !removedIds.has(existingImage.$jazz.id)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					imageList.$jazz.push(existingImage as any)
				}
			}
		}

		if (input.imageFiles) {
			let remainingSlots = 10 - imageList.length
			for (let file of input.imageFiles.slice(0, remainingSlots)) {
				let image = await createImage(file, {
					owner: person.$jazz.owner,
					maxSize: 2048,
					placeholder: "blur",
					progressive: true,
				})
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				imageList.$jazz.push(image as any)
			}
		}

		if (imageList.length === 0) {
			note.$jazz.delete("images")
			note.$jazz.delete("imageCount")
		} else {
			note.$jazz.set("images", imageList)
			note.$jazz.set("imageCount", imageList.length)
		}
	}

	if ("deletedAt" in input && input.deletedAt === undefined) {
		note.$jazz.delete("deletedAt")
		if (person.inactiveNotes?.$isLoaded) {
			let inactiveIdx = Array.from(person.inactiveNotes.values()).findIndex(
				n => n?.$jazz.id === input.noteId,
			)
			if (inactiveIdx !== -1) {
				person.notes.$jazz.push(note)
				person.inactiveNotes.$jazz.splice(inactiveIdx, 1)
			}
		}
	}

	if (input.deletedAt !== undefined) {
		note.$jazz.set("deletedAt", new Date(input.deletedAt))
		if (person.inactiveNotes?.$isLoaded) {
			let activeIdx = Array.from(person.notes.values()).findIndex(
				n => n?.$jazz.id === input.noteId,
			)
			if (activeIdx !== -1) {
				person.inactiveNotes.$jazz.push(note)
				person.notes.$jazz.splice(activeIdx, 1)
			}
		}
	}

	note.$jazz.set("updatedAt", new Date())
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "update",
		current: serializeNote(note, input.personId),
		previous,
	}
}

function serializeNote(
	note: co.loaded<typeof Note>,
	personId: string,
): NoteCurrent {
	return {
		noteId: note.$jazz.id,
		personId,
		title: note.title,
		content: note.content,
		pinned: note.pinned ?? false,
		imageCount: note.imageCount,
		createdAt: note.createdAt.toISOString(),
		updatedAt: note.updatedAt.toISOString(),
		deletedAt: note.deletedAt?.toISOString(),
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	NOTE_NOT_FOUND: "note not found",
} as const

let createEditNoteTool = defineTool({
	description: "Edit a note by ID",
	input: editNoteInput,
	output: updatedSchema(noteCurrent),
	serverOp: updateNote,
})

let deleteNoteInput = z.object({
	personId: z.string().describe("The person's ID who owns the note"),
	noteId: z.string().describe("The note's ID"),
})

let createDeleteNoteTool = defineTool({
	description: "Delete a note by ID",
	input: deleteNoteInput,
	output: updatedSchema(noteCurrent),
	serverOp: (worker, input) =>
		updateNote(worker, { ...input, deletedAt: new Date() }),
})
