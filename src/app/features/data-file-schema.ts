import { z } from "zod"

export const FileAvatarSchema = z
	.object({
		dataURL: z.string(),
	})
	.nullable()

export const FileNoteSchema = z.object({
	id: z.string().optional(),
	content: z.string(),
	pinned: z.boolean().optional(),
	images: z.array(FileAvatarSchema).optional(),
	deleted: z.boolean().optional(),
	deletedAt: z.coerce.date().optional(),
	permanentlyDeletedAt: z.coerce.date().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
})

export const FileReminderSchema = z.object({
	id: z.string().optional(),
	text: z.string(),
	dueAtDate: z.string(),
	repeat: z
		.object({
			interval: z.number().min(1),
			unit: z.enum(["day", "week", "month", "year"]),
		})
		.optional(),
	done: z.boolean().optional(),
	deleted: z.boolean().optional(),
	deletedAt: z.coerce.date().optional(),
	permanentlyDeletedAt: z.coerce.date().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
})

export const FilePersonSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	summary: z.string().optional(),
	avatar: FileAvatarSchema.optional(),
	notes: z.array(FileNoteSchema).optional(),
	reminders: z.array(FileReminderSchema).optional(),
	deleted: z.boolean().optional(),
	deletedAt: z.coerce.date().optional(),
	permanentlyDeletedAt: z.coerce.date().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
})

export const FileDataSchema = z.object({
	type: z.literal("tilly"),
	version: z.literal(1),
	people: z.array(FilePersonSchema),
})

export type FileData = z.infer<typeof FileDataSchema>
export type FilePerson = z.infer<typeof FilePersonSchema>
export type FileAvatar = z.infer<typeof FileAvatarSchema>
export type FileNote = z.infer<typeof FileNoteSchema>
export type FileReminder = z.infer<typeof FileReminderSchema>
