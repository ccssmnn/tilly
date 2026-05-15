import { z } from "zod"
import { Person, Reminder } from "#shared/schema/user"
import {
	defineTool,
	createdSchema,
	type Created,
	type Worker,
} from "#shared/tools/define-tool"

export { createReminder, createAddReminderTool, reminderCurrent }

let repeatSchema = z.object({
	interval: z.number().min(1),
	unit: z.enum(["day", "week", "month", "year"]),
})

let reminderCurrent = z.object({
	reminderId: z.string(),
	personId: z.string(),
	text: z.string(),
	dueAtDate: z.string(),
	repeat: repeatSchema.optional(),
	done: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	deletedAt: z.string().optional(),
})

type ReminderCurrent = z.infer<typeof reminderCurrent>

let createReminderInput = z.object({
	personId: z.string().describe("The person's ID"),
	text: z.string().describe("The reminder text"),
	dueAtDate: z
		.string()
		.describe("Due date as a date string (e.g., '2025-07-18')"),
	repeat: repeatSchema.optional().describe("Optional repeat configuration"),
})

async function createReminder(
	worker: Worker,
	input: z.infer<typeof createReminderInput>,
): Promise<Created<ReminderCurrent>> {
	let person = await Person.load(input.personId, {
		resolve: { reminders: { $each: true } },
		loadAs: worker,
	})
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let now = new Date()
	let reminder = Reminder.create(
		{
			version: 1,
			text: input.text,
			dueAtDate: input.dueAtDate,
			repeat: input.repeat,
			done: false,
			createdAt: now,
			updatedAt: now,
		},
		person.$jazz.owner,
	)

	person.reminders.$jazz.push(reminder)
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "create",
		current: {
			reminderId: reminder.$jazz.id,
			personId: input.personId,
			text: reminder.text,
			dueAtDate: reminder.dueAtDate,
			repeat: reminder.repeat,
			done: reminder.done,
			createdAt: reminder.createdAt.toISOString(),
			updatedAt: reminder.updatedAt.toISOString(),
		},
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
} as const

let createAddReminderTool = defineTool({
	description: "Add a reminder for a person using their ID",
	input: createReminderInput,
	output: createdSchema(reminderCurrent),
	serverOp: createReminder,
})
