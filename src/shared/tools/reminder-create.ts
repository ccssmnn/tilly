import { tool } from "ai"
import { z } from "zod"
import { Person, Reminder, UserAccount } from "#shared/schema/user"
import { co, type Loaded } from "jazz-tools"
import { tryCatch } from "#shared/lib/trycatch"

export { createAddReminderTool, createReminder }

export type { ReminderData, ReminderCreated }

async function createReminder(
	data: {
		text: string
		dueAtDate: string
		repeat?: {
			interval: number
			unit: "day" | "week" | "month" | "year"
		}
	},
	options: {
		personId: string
		worker: Loaded<typeof UserAccount>
	},
): Promise<ReminderCreated> {
	let person = await Person.load(options.personId, {
		resolve: { reminders: { $each: true } },
		loadAs: options.worker,
	})

	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let now = new Date()

	let reminder = Reminder.create({
		version: 1,
		text: data.text,
		dueAtDate: data.dueAtDate,
		repeat: data.repeat,
		done: false,
		createdAt: now,
		updatedAt: now,
	})

	person.reminders.$jazz.push(reminder)
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "create",
		reminderID: reminder.$jazz.id,
		personID: options.personId,
		current: { ...reminder },
		_ref: reminder,
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	REMINDER_NOT_FOUND: "reminder not found",
	REMINDER_ALREADY_DONE: "cannot set reminder to done. is already done.",
} as const

type ReminderData = Parameters<typeof Reminder.create>[0]

type ReminderCreated = {
	_ref: co.loaded<typeof Reminder>
	operation: "create"
	reminderID: string
	personID: string
	current: ReminderData
}

function createAddReminderTool(worker: Loaded<typeof UserAccount>) {
	return tool({
		description: "Add a reminder for a person using their ID",
		inputSchema: z.object({
			personId: z.string().describe("The person's ID"),
			text: z.string().describe("The reminder text"),
			dueAtDate: z
				.string()
				.describe("Due date as a date string (e.g., '2025-07-18')"),
			repeat: z
				.object({
					interval: z.number().min(1),
					unit: z.enum(["day", "week", "month", "year"]),
				})
				.optional()
				.describe("Optional repeat configuration"),
		}),
		execute: async input => {
			let { personId, ...data } = input

			let res = await tryCatch(createReminder(data, { personId, worker }))
			if (!res.ok) return { error: `${res.error}` }
			let result = res.data
			return {
				personId: result.personID,
				reminderId: result.reminderID,
				text: result.current.text,
				dueAtDate: result.current.dueAtDate,
				repeat: result.current.repeat,
				done: result.current.done,
				createdAt: result.current.createdAt.toISOString(),
				updatedAt: result.current.updatedAt.toISOString(),
			}
		},
	})
}
