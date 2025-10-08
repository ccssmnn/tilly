import { tool } from "ai"
import { z } from "zod"
import {
	UserAccount,
	Person,
	Reminder,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import type { co, ResolveQuery } from "jazz-tools"

export { listRemindersTool, listRemindersExecute }

let query = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

async function listReminders(options: {
	userId: string
	searchQuery?: string
	dueOnly?: boolean
	includeDeleted?: boolean
	includeDone?: boolean
}): Promise<ListRemindersResult> {
	let userResult = await tryCatch(
		UserAccount.load(options.userId, { resolve: query }),
	)
	if (!userResult.ok) throw errors.USER_NOT_FOUND

	let user = userResult.data
	if (!user) throw errors.USER_NOT_FOUND

	let people = user.root?.people ?? []

	let allReminders: Array<{
		reminder: co.loaded<typeof Reminder>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of people) {
		if (isPermanentlyDeleted(person) || isDeleted(person)) continue
		if (!person.reminders) continue

		for (let reminder of person.reminders) {
			if (isPermanentlyDeleted(reminder)) continue
			if (!options.includeDone && reminder.done) continue
			if (!options.includeDeleted && isDeleted(reminder)) continue

			allReminders.push({ reminder, person })
		}
	}

	allReminders.sort(
		(a, b) =>
			new Date(a.reminder.dueAtDate).getTime() -
			new Date(b.reminder.dueAtDate).getTime(),
	)

	// Filter by due date if dueOnly is true
	let filteredReminders = allReminders
	if (options.dueOnly) {
		let now = new Date()
		filteredReminders = allReminders.filter(({ reminder }) => {
			let dueDate = new Date(reminder.dueAtDate)
			return dueDate <= now
		})
	}
	if (options.searchQuery) {
		let searchLower = options.searchQuery.toLowerCase()
		filteredReminders = filteredReminders.filter(
			({ reminder, person }) =>
				reminder.text.toLowerCase().includes(searchLower) ||
				person.name.toLowerCase().includes(searchLower),
		)
	}

	return {
		operation: "list",
		reminders: filteredReminders.map(({ reminder, person }) => ({
			id: reminder.$jazz.id,
			text: reminder.text,
			dueAtDate: reminder.dueAtDate,
			repeat: reminder.repeat,
			done: reminder.done,
			deletedAt: reminder.deletedAt,
			createdAt: reminder.createdAt.toISOString(),
			updatedAt: reminder.updatedAt.toISOString(),
			person: {
				id: person.$jazz.id,
				name: person.name,
			},
		})),
		totalCount: allReminders.length,
		filteredCount: filteredReminders.length,
		searchQuery: options.searchQuery,
		dueOnly: options.dueOnly,
	}
}

let errors = {
	USER_NOT_FOUND: "user not found",
} as const

type ListRemindersResult = {
	operation: "list"
	reminders: Array<{
		id: string
		text: string
		dueAtDate?: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
		done: boolean
		createdAt: string
		updatedAt: string
		person: {
			id: string
			name: string
		}
	}>
	totalCount: number
	filteredCount: number
	searchQuery?: string
	dueOnly?: boolean
}

let listRemindersTool = tool({
	description:
		"List all reminders across all people with optional search and due date filtering. By default, only shows undone and undeleted reminders.",
	inputSchema: z.object({
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
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			operation: z.literal("list"),
			reminders: z.array(
				z.object({
					id: z.string(),
					text: z.string(),
					dueAtDate: z.string().optional(),
					repeat: z
						.object({
							interval: z.number(),
							unit: z.enum(["day", "week", "month", "year"]),
						})
						.optional(),
					done: z.boolean(),
					deleted: z.boolean().optional(),
					createdAt: z.string(),
					updatedAt: z.string(),
					person: z.object({
						id: z.string(),
						name: z.string(),
					}),
				}),
			),
			totalCount: z.number(),
			filteredCount: z.number(),
			searchQuery: z.string().optional(),
			dueOnly: z.boolean().optional(),
		}),
	]),
})

async function listRemindersExecute(
	userId: string,
	input: {
		searchQuery?: string
		dueOnly?: boolean
		includeDeleted?: boolean
		includeDone?: boolean
	},
) {
	let res = await tryCatch(listReminders({ userId, ...input }))
	if (!res.ok) return { error: `${res.error}` }
	return res.data
}
