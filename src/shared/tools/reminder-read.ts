import { z } from "zod"
import type { co } from "jazz-tools"
import { isDeleted, Person, Reminder } from "#shared/schema/user"
import { defineTool, type Worker } from "#shared/tools/define-tool"

export { listReminders, createListRemindersTool }

let repeatSchema = z.object({
	interval: z.number().min(1),
	unit: z.enum(["day", "week", "month", "year"]),
})

let reminderSummary = z.object({
	id: z.string(),
	text: z.string(),
	dueAtDate: z.string(),
	repeat: repeatSchema.optional(),
	done: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	person: z.object({
		id: z.string(),
		name: z.string(),
	}),
})

let listRemindersInput = z.object({
	searchQuery: z
		.string()
		.optional()
		.describe(
			"Optional search query to filter reminders by text or person name",
		),
	dueOnly: z
		.boolean()
		.optional()
		.describe("If true, only show reminders that are due now or overdue"),
	includeDeleted: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include deleted reminders in results"),
	includeDone: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include completed reminders in results"),
})

let listRemindersOutput = z.object({
	operation: z.literal("list"),
	reminders: z.array(reminderSummary),
	totalCount: z.number(),
	filteredCount: z.number(),
	searchQuery: z.string().optional(),
	dueOnly: z.boolean().optional(),
})

async function listReminders(
	worker: Worker,
	input: z.infer<typeof listRemindersInput>,
): Promise<z.infer<typeof listRemindersOutput>> {
	let user = await worker.$jazz.ensureLoaded({
		resolve: {
			root: {
				people: {
					$each: {
						avatar: true,
						reminders: { $each: true },
						inactiveReminders: { $each: true },
					},
				},
			},
		},
	})
	if (!user.$isLoaded) throw new Error("user not found")

	let pairs: Array<{
		reminder: co.loaded<typeof Reminder>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of user.root.people.values()) {
		if (!person || isDeleted(person)) continue
		if (person.reminders) {
			for (let reminder of person.reminders.values()) {
				if (!reminder) continue
				if (!input.includeDone && reminder.done) continue
				if (!input.includeDeleted && isDeleted(reminder)) continue
				pairs.push({ reminder, person })
			}
		}
		if (
			person.inactiveReminders &&
			(input.includeDone || input.includeDeleted)
		) {
			for (let reminder of person.inactiveReminders.values()) {
				if (!reminder) continue
				if (!input.includeDone && reminder.done) continue
				if (!input.includeDeleted && isDeleted(reminder)) continue
				pairs.push({ reminder, person })
			}
		}
	}

	pairs.sort(
		(a, b) =>
			new Date(a.reminder.dueAtDate).getTime() -
			new Date(b.reminder.dueAtDate).getTime(),
	)

	let filtered = pairs
	if (input.dueOnly) {
		let now = new Date()
		filtered = pairs.filter(
			({ reminder }) => new Date(reminder.dueAtDate) <= now,
		)
	}
	if (input.searchQuery) {
		let q = input.searchQuery.toLowerCase()
		filtered = filtered.filter(
			({ reminder, person }) =>
				reminder.text.toLowerCase().includes(q) ||
				person.name.toLowerCase().includes(q),
		)
	}

	return {
		operation: "list" as const,
		reminders: filtered.map(({ reminder, person }) => ({
			id: reminder.$jazz.id,
			text: reminder.text,
			dueAtDate: reminder.dueAtDate,
			repeat: reminder.repeat,
			done: reminder.done,
			createdAt: reminder.createdAt.toISOString(),
			updatedAt: reminder.updatedAt.toISOString(),
			person: {
				id: person.$jazz.id,
				name: person.name,
			},
		})),
		totalCount: pairs.length,
		filteredCount: filtered.length,
		searchQuery: input.searchQuery,
		dueOnly: input.dueOnly,
	}
}

let createListRemindersTool = defineTool({
	description:
		"List all reminders across all people with optional search and due date filtering. By default, only shows undone and undeleted reminders.",
	input: listRemindersInput,
	output: listRemindersOutput,
	serverOp: listReminders,
})
