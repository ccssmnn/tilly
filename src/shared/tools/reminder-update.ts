import { format, parse } from "date-fns"
import { tool, type InferUITool } from "ai"
import { z } from "zod"
import { Person, Reminder } from "#shared/schema/user"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"
import { co } from "jazz-tools"
import { tryCatch } from "#shared/lib/trycatch"

export {
	updateReminderTool,
	updateReminderExecute,
	removeReminderTool,
	removeReminderExecute,
	updateReminder,
}

export type { ReminderData, ReminderUpdated }

async function updateReminder(
	updates: {
		text?: string
		dueAtDate?: string
		repeat?: {
			interval: number
			unit: "day" | "week" | "month" | "year"
		}
		done?: boolean
		deletedAt?: Date | undefined
		permanentlyDeletedAt?: Date | undefined
	},
	options: {
		userId: string
		personId: string
		reminderId: string
	},
): Promise<ReminderUpdated> {
	let person = await Person.load(options.personId)
	if (!person) throw errors.PERSON_NOT_FOUND

	let reminder = await Reminder.load(options.reminderId)
	if (!reminder) throw errors.REMINDER_NOT_FOUND

	let previous = { ...reminder }

	if (updates.text !== undefined) {
		reminder.$jazz.set("text", updates.text)
	}
	if (updates.dueAtDate !== undefined) {
		reminder.$jazz.set("dueAtDate", updates.dueAtDate)
	}
	if (updates.repeat !== undefined) {
		reminder.$jazz.set("repeat", updates.repeat)
	}
	if ("repeat" in updates && updates.repeat === undefined) {
		reminder.$jazz.delete("repeat")
	}
	if (updates.done === true && !reminder.done && !reminder.repeat) {
		reminder.$jazz.set("done", updates.done)
	}
	if (updates.done === true && !reminder.done && reminder.repeat) {
		let { nextDueAtDate } = calculateNextDueDate(reminder)
		reminder.$jazz.set("dueAtDate", nextDueAtDate)
		reminder.$jazz.set("done", false)
	}
	if (updates.done === false && reminder.done) {
		reminder.$jazz.set("done", updates.done)
	}

	if ("deletedAt" in updates && updates.deletedAt === undefined) {
		reminder.$jazz.delete("deletedAt")
	}

	if (updates.deletedAt !== undefined) {
		reminder.$jazz.set("deletedAt", updates.deletedAt)
	}

	if (updates.permanentlyDeletedAt !== undefined) {
		reminder.$jazz.set("permanentlyDeletedAt", updates.permanentlyDeletedAt)
	}

	reminder.$jazz.set("updatedAt", new Date())
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "update",
		reminderID: options.reminderId,
		personID: options.personId,
		current: { ...reminder },
		previous,
		_ref: reminder,
	}
}

function calculateNextDueDate(reminder: co.loaded<typeof Reminder>): {
	nextDueAtDate: string
} {
	if (!reminder.repeat)
		return {
			nextDueAtDate: reminder.dueAtDate || "",
		}

	let currentDueDate = parse(reminder.dueAtDate, "yyyy-MM-dd", new Date())
	let { interval, unit } = reminder.repeat

	let nextDueDate: Date
	switch (unit) {
		case "day":
			nextDueDate = addDays(currentDueDate, interval)
			break
		case "week":
			nextDueDate = addWeeks(currentDueDate, interval)
			break
		case "month":
			nextDueDate = addMonths(currentDueDate, interval)
			break
		case "year":
			nextDueDate = addYears(currentDueDate, interval)
			break
		default:
			nextDueDate = addDays(currentDueDate, 1)
	}

	let nextDueAtDate = format(nextDueDate, "yyyy-MM-dd")

	return { nextDueAtDate }
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	REMINDER_NOT_FOUND: "reminder not found",
	REMINDER_ALREADY_DONE: "cannot set reminder to done. is already done.",
} as const

type ReminderData = Parameters<typeof Reminder.create>[0]

type ReminderUpdated = {
	_ref: co.loaded<typeof Reminder>
	operation: "update"
	reminderID: string
	personID: string
	current: ReminderData
	previous: ReminderData
}

let updateReminderTool = tool({
	description:
		"Update a reminder's text, due date, repeat settings, or done status",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID who owns the reminder"),
		reminderId: z.string().describe("The reminder's ID"),
		text: z.string().optional().describe("The new reminder text"),
		dueAtDate: z
			.string()
			.optional()
			.describe("New due date as a date string (e.g., '2025-07-18')"),
		repeat: z
			.object({
				interval: z.number().min(1),
				unit: z.enum(["day", "week", "month", "year"]),
			})
			.optional()
			.describe("New repeat configuration"),
		done: z.boolean().optional().describe("Mark reminder as done/undone"),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			reminderId: z.string(),
			text: z.string(),
			dueAtDate: z.string().optional(),
			repeat: z
				.object({
					interval: z.number(),
					unit: z.enum(["day", "week", "month", "year"]),
				})
				.optional(),
			done: z.boolean(),
			createdAt: z.string(),
			updatedAt: z.string(),
			previous: z
				.object({
					text: z.string(),
					dueAtDate: z.string().optional(),
					repeat: z
						.object({
							interval: z.number(),
							unit: z.enum(["day", "week", "month", "year"]),
						})
						.optional(),
					done: z.boolean(),
					createdAt: z.string().optional(),
					updatedAt: z.string().optional(),
				})
				.optional(),
		}),
	]),
})

type _UpdateReminderTool = InferUITool<typeof updateReminderTool>

async function updateReminderExecute(
	userId: string,
	input: _UpdateReminderTool["input"],
): Promise<_UpdateReminderTool["output"]> {
	let { personId, reminderId, ...updates } = input
	let res = await tryCatch(
		updateReminder(updates, { userId, personId, reminderId }),
	)
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
		previous: {
			text: result.previous.text,
			dueAtDate: result.previous.dueAtDate,
			repeat: result.previous.repeat,
			done: result.previous.done,
			createdAt: result.previous.createdAt.toISOString(),
			updatedAt: result.previous.updatedAt.toISOString(),
		},
	}
}

let removeReminderTool = tool({
	description: "Remove a reminder from a person",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID who owns the reminder"),
		reminderId: z.string().describe("The reminder's ID to remove"),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			reminderId: z.string(),
			text: z.string(),
			dueAtDate: z.string().optional(),
			repeat: z
				.object({
					interval: z.number(),
					unit: z.enum(["day", "week", "month", "year"]),
				})
				.optional(),
			done: z.boolean(),
			deletedAt: z.string().optional(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	]),
})

type _RemoveReminderTool = InferUITool<typeof removeReminderTool>

async function removeReminderExecute(
	userId: string,
	input: _RemoveReminderTool["input"],
): Promise<_RemoveReminderTool["output"]> {
	let { personId, reminderId } = input

	let res = await tryCatch(
		updateReminder({ deletedAt: new Date() }, { userId, personId, reminderId }),
	)
	if (!res.ok) return { error: `${res.error}` }
	let result = res.data
	return {
		personId: result.personID,
		reminderId: result.reminderID,
		text: result.current.text,
		dueAtDate: result.current.dueAtDate,
		repeat: result.current.repeat,
		done: result.current.done,
		deletedAt: result.current.deletedAt?.toISOString(),
		createdAt: result.current.createdAt.toISOString(),
		updatedAt: result.current.updatedAt.toISOString(),
	}
}
