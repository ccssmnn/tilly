import { tool } from "ai"
import { z } from "zod"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { co, type Loaded } from "jazz-tools"
import { tryCatch } from "#shared/lib/trycatch"
import { createImage } from "jazz-tools/media"

export { createEditNoteTool, createDeleteNoteTool, updateNote }

export type { NoteData, NoteUpdated }

async function updateNote(
	updates: Partial<
		Pick<NoteData, "title" | "content" | "pinned" | "createdAt"> & {
			deletedAt: Date | string | undefined
			permanentlyDeletedAt: Date | string | undefined
		}
	> & {
		imageFiles?: File[]
		removedImageIds?: string[]
	},
	options: {
		personId: string
		noteId: string
		worker: Loaded<typeof UserAccount>
	},
): Promise<NoteUpdated> {
	let person = await Person.load(options.personId, {
		loadAs: options.worker,
	})
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let note = await Note.load(options.noteId, {
		resolve: { images: { $each: true } },
		loadAs: options.worker,
	})
	if (!note.$isLoaded) throw errors.NOTE_NOT_FOUND

	let previous = {
		version: note.version,
		title: note.title,
		content: note.content,
		pinned: note.pinned,
		deletedAt: note.deletedAt,
		permanentlyDeletedAt: note.permanentlyDeletedAt,
		createdAt: note.createdAt,
		updatedAt: note.updatedAt,
		imageCount: note.imageCount,
	}

	if (updates.title !== undefined) {
		note.$jazz.set("title", updates.title)
	}
	if (updates.content !== undefined) {
		note.$jazz.set("content", updates.content)
	}
	if (updates.pinned !== undefined) {
		note.$jazz.set("pinned", updates.pinned)
	}

	if (updates.createdAt !== undefined) {
		let createdDate = new Date(updates.createdAt)
		let now = new Date()
		createdDate.setHours(
			now.getHours(),
			now.getMinutes(),
			now.getSeconds(),
			now.getMilliseconds(),
		)
		note.$jazz.set("createdAt", createdDate)
	}

	if (
		updates.imageFiles !== undefined ||
		updates.removedImageIds !== undefined
	) {
		let imageList = co.list(co.image()).create([])

		// Add existing images that weren't removed
		if (note.images?.$isLoaded) {
			let removedIds = new Set(updates.removedImageIds || [])
			for (let existingImage of note.images.values()) {
				if (existingImage && !removedIds.has(existingImage.$jazz.id)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					imageList.$jazz.push(existingImage as any)
				}
			}
		}

		// Add new images
		if (updates.imageFiles) {
			let remainingSlots = 10 - imageList.length
			for (let file of updates.imageFiles.slice(0, remainingSlots)) {
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
		noteID: options.noteId,
		personID: options.personId,
		current: {
			version: note.version,
			title: note.title,
			content: note.content,
			pinned: note.pinned,
			deletedAt: note.deletedAt,
			permanentlyDeletedAt: note.permanentlyDeletedAt,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
			imageCount: note.imageCount,
		},
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

function createEditNoteTool(worker: Loaded<typeof UserAccount>) {
	return tool({
		description: "Edit a note by ID",
		inputSchema: z.object({
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
		}),
		execute: async input => {
			let { personId, noteId, createdAt, ...otherUpdates } = input
			let updates = {
				...otherUpdates,
				...(createdAt !== undefined && { createdAt: new Date(createdAt) }),
			}

			let res = await tryCatch(
				updateNote(updates, { personId, noteId, worker }),
			)
			if (!res.ok) return { error: `${res.error}` }
			let result = res.data
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
		},
	})
}

function createDeleteNoteTool(worker: Loaded<typeof UserAccount>) {
	return tool({
		description: "Delete a note by ID",
		inputSchema: z.object({
			personId: z.string().describe("The person's ID who owns the note"),
			noteId: z.string().describe("The note's ID"),
		}),
		execute: async input => {
			let { personId, noteId } = input

			let res = await tryCatch(
				updateNote({ deletedAt: new Date() }, { personId, noteId, worker }),
			)
			if (!res.ok) return { error: `${res.error}` }
			let result = res.data
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
		},
	})
}
