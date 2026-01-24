import { tool } from "ai"
import { z } from "zod"
import { UserAccount, Person, Reminder, isDeleted } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import type { co, ResolveQuery, Loaded } from "jazz-tools"

export { createListRemindersTool }

let query = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

async function listReminders(options: {
	worker: Loaded<typeof UserAccount>
	searchQuery?: string
	dueOnly?: boolean
	includeDeleted?: boolean
	includeDone?: boolean
}): Promise<ListRemindersResult> {
	let worker = await options.worker.$jazz.ensureLoaded({ resolve: query })
	if (!worker.$isLoaded) throw errors.USER_NOT_FOUND

	let allReminders: Array<{
		reminder: co.loaded<typeof Reminder>
		person: co.loaded<typeof Person>
	}> = []

	for (let person of worker.root.people.values()) {
		if (isDeleted(person)) continue

		// Check active reminders
		if (person.reminders) {
			for (let reminder of person.reminders.values()) {
				if (!options.includeDone && reminder.done) continue
				if (!options.includeDeleted && isDeleted(reminder)) continue

				allReminders.push({ reminder, person })
			}
		}

		// Check inactive reminders if includeDone or includeDeleted is true
		if (
			person.inactiveReminders &&
			(options.includeDone || options.includeDeleted)
		) {
			for (let reminder of person.inactiveReminders.values()) {
				if (!options.includeDone && reminder.done) continue
				if (!options.includeDeleted && isDeleted(reminder)) continue

				allReminders.push({ reminder, person })
			}
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

function createListRemindersTool(worker: Loaded<typeof UserAccount>) {
	return tool({
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
		execute: async input => {
			let res = await tryCatch(listReminders({ worker, ...input }))
			if (!res.ok) return { error: `${res.error}` }
			return res.data
		},
	})
}
