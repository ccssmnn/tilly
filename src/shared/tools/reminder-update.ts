import { format, parse, addDays, addWeeks, addMonths, addYears } from "date-fns"
import { z } from "zod"
import { co } from "jazz-tools"
import { Person, Reminder } from "#shared/schema/user"
import {
	defineTool,
	updatedSchema,
	type Updated,
	type Worker,
} from "#shared/tools/define-tool"
import { reminderCurrent } from "#shared/tools/reminder-create"

export { updateReminder, createUpdateReminderTool, createRemoveReminderTool }

type ReminderCurrent = z.infer<typeof reminderCurrent>

let repeatSchema = z.object({
	interval: z.number().min(1),
	unit: z.enum(["day", "week", "month", "year"]),
})

let updateReminderInput = z.object({
	personId: z.string().describe("The person's ID who owns the reminder"),
	reminderId: z.string().describe("The reminder's ID"),
	text: z.string().optional().describe("The new reminder text"),
	dueAtDate: z
		.string()
		.optional()
		.describe("New due date as a date string (e.g., '2025-07-18')"),
	repeat: repeatSchema.optional().describe("New repeat configuration"),
	done: z.boolean().optional().describe("Mark reminder as done/undone"),
})

type UpdateReminderInput = z.infer<typeof updateReminderInput> & {
	deletedAt?: Date | undefined
}

async function updateReminder(
	worker: Worker,
	input: UpdateReminderInput,
): Promise<Updated<ReminderCurrent>> {
	let person = await Person.load(input.personId, {
		resolve: { reminders: true, inactiveReminders: true },
		loadAs: worker,
	})
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	if (!person.inactiveReminders) {
		person.$jazz.set(
			"inactiveReminders",
			co.list(Reminder).create([], person.$jazz.owner),
		)
	}

	let reminder = await Reminder.load(input.reminderId, { loadAs: worker })
	if (!reminder.$isLoaded) throw errors.REMINDER_NOT_FOUND

	let previous: ReminderCurrent = serializeReminder(reminder, input.personId)

	if (input.text !== undefined) {
		reminder.$jazz.set("text", input.text)
	}
	if (input.dueAtDate !== undefined) {
		reminder.$jazz.set("dueAtDate", input.dueAtDate)
	}
	if (input.repeat !== undefined) {
		reminder.$jazz.set("repeat", input.repeat)
	}
	if ("repeat" in input && input.repeat === undefined) {
		reminder.$jazz.delete("repeat")
	}

	if (input.done === true && !reminder.done && !reminder.repeat) {
		reminder.$jazz.set("done", input.done)
		if (person.inactiveReminders?.$isLoaded) {
			let activeIdx = Array.from(person.reminders.values()).findIndex(
				r => r?.$jazz.id === input.reminderId,
			)
			if (activeIdx !== -1) {
				person.inactiveReminders.$jazz.push(reminder)
				person.reminders.$jazz.splice(activeIdx, 1)
			}
		}
	}
	if (input.done === true && !reminder.done && reminder.repeat) {
		let { nextDueAtDate } = calculateNextDueDate(reminder)
		reminder.$jazz.set("dueAtDate", nextDueAtDate)
		reminder.$jazz.set("done", false)
	}
	if (input.done === false && reminder.done) {
		reminder.$jazz.set("done", input.done)
		if (!reminder.deletedAt && person.inactiveReminders?.$isLoaded) {
			let inactiveIdx = Array.from(person.inactiveReminders.values()).findIndex(
				r => r?.$jazz.id === input.reminderId,
			)
			if (inactiveIdx !== -1) {
				person.reminders.$jazz.push(reminder)
				person.inactiveReminders.$jazz.splice(inactiveIdx, 1)
			}
		}
	}

	if ("deletedAt" in input && input.deletedAt === undefined) {
		reminder.$jazz.delete("deletedAt")
		if (!reminder.done && person.inactiveReminders?.$isLoaded) {
			let inactiveIdx = Array.from(person.inactiveReminders.values()).findIndex(
				r => r?.$jazz.id === input.reminderId,
			)
			if (inactiveIdx !== -1) {
				person.reminders.$jazz.push(reminder)
				person.inactiveReminders.$jazz.splice(inactiveIdx, 1)
			}
		}
	}

	if (input.deletedAt !== undefined) {
		reminder.$jazz.set("deletedAt", input.deletedAt)
		if (person.inactiveReminders?.$isLoaded) {
			let activeIdx = Array.from(person.reminders.values()).findIndex(
				r => r?.$jazz.id === input.reminderId,
			)
			if (activeIdx !== -1) {
				person.inactiveReminders.$jazz.push(reminder)
				person.reminders.$jazz.splice(activeIdx, 1)
			}
		}
	}

	reminder.$jazz.set("updatedAt", new Date())
	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "update",
		current: serializeReminder(reminder, input.personId),
		previous,
	}
}

function serializeReminder(
	reminder: co.loaded<typeof Reminder>,
	personId: string,
): ReminderCurrent {
	return {
		reminderId: reminder.$jazz.id,
		personId,
		text: reminder.text,
		dueAtDate: reminder.dueAtDate,
		repeat: reminder.repeat,
		done: reminder.done,
		createdAt: reminder.createdAt.toISOString(),
		updatedAt: reminder.updatedAt.toISOString(),
		deletedAt: reminder.deletedAt?.toISOString(),
	}
}

function calculateNextDueDate(reminder: co.loaded<typeof Reminder>): {
	nextDueAtDate: string
} {
	if (!reminder.repeat) return { nextDueAtDate: reminder.dueAtDate || "" }

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
			nextDueDate = addDays(currentDueDate, interval)
	}

	return { nextDueAtDate: format(nextDueDate, "yyyy-MM-dd") }
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	REMINDER_NOT_FOUND: "reminder not found",
} as const

let createUpdateReminderTool = defineTool({
	description:
		"Update a reminder's text, due date, repeat settings, or done status",
	input: updateReminderInput,
	output: updatedSchema(reminderCurrent),
	serverOp: updateReminder,
})

let removeReminderInput = z.object({
	personId: z.string().describe("The person's ID who owns the reminder"),
	reminderId: z.string().describe("The reminder's ID to remove"),
})

let createRemoveReminderTool = defineTool({
	description: "Remove a reminder from a person",
	input: removeReminderInput,
	output: updatedSchema(reminderCurrent),
	serverOp: (worker, input) =>
		updateReminder(worker, { ...input, deletedAt: new Date() }),
})
