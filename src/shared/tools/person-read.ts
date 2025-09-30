import { tool, type InferUITool } from "ai"
import { z } from "zod"
import { co } from "jazz-tools"
import {
	Person,
	UserAccount,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"

export {
	listPeopleTool,
	listPeopleExecute,
	getPersonDetailsTool,
	getPersonDetailsExecute,
}

function searchPeople(
	people: Array<co.loaded<typeof Person>>,
	searchName: string,
) {
	let validPeople = people.filter(person => person?.name)
	let searchLower = searchName.toLowerCase().trim()

	return validPeople
		.filter(person => {
			let nameMatch = person.name.toLowerCase().includes(searchLower)
			let summaryMatch =
				person.summary?.toLowerCase().includes(searchLower) || false
			return nameMatch || summaryMatch
		})
		.slice(0, 3)
}

let listPeopleTool = tool({
	description:
		"List people with their ID, name, and summary. Optionally search people by names and summaries.",
	inputSchema: z.object({
		search: z
			.string()
			.optional()
			.describe(
				"Optional search query to filter people by names and summaries",
			),
		includeDeleted: z
			.boolean()
			.optional()
			.default(false)
			.describe("Include deleted people in results"),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			people: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					summary: z.string().nullable(),
					deleted: z.boolean().optional(),
				}),
			),
			count: z.number(),
			searchQuery: z.string().optional(),
		}),
	]),
})

type _ListPeopleTool = InferUITool<typeof listPeopleTool>

async function listPeopleExecute(
	userId: string,
	input: _ListPeopleTool["input"],
): Promise<_ListPeopleTool["output"]> {
	let me = await UserAccount.load(userId, {
		resolve: { root: { people: { $each: true } } },
	})
	if (!me?.root?.people) {
		return { error: "No people data available" }
	}

	let allPeople = me.root.people
		.filter(person => person != null)
		.filter(person => !isPermanentlyDeleted(person))
		.filter(person => input.includeDeleted || !isDeleted(person))

	let people
	if (input.search) {
		people = searchPeople(allPeople, input.search).map(person => ({
			id: person.$jazz.id,
			name: person.name,
			summary: person.summary || null,
			deletedAt: person.deletedAt,
		}))
	} else {
		people = allPeople.map(person => ({
			id: person.$jazz.id,
			name: person.name,
			summary: person.summary || null,
			deletedAt: person.deletedAt,
		}))
	}

	return {
		people,
		count: people.length,
		...(input.search && { searchQuery: input.search }),
	}
}

let getPersonDetailsTool = tool({
	description:
		"Get detailed information for a specific person by their ID. Returns the person's full data including all notes and reminders. Optionally filter notes and reminders using a search query.",
	inputSchema: z.object({
		personId: z
			.string()
			.describe("The unique ID of the person to retrieve details for"),
		search: z
			.string()
			.optional()
			.describe(
				"Optional search query to filter notes and reminders by content",
			),
		includeDeletedNotes: z
			.boolean()
			.optional()
			.default(false)
			.describe("Include deleted notes in results"),
		includeDeletedReminders: z
			.boolean()
			.optional()
			.default(false)
			.describe("Include deleted reminders in results"),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			name: z.string(),
			summary: z.string().optional(),
			deletedAt: z.string().optional(),
			notes: z.array(
				z.object({
					id: z.string(),
					title: z.string(),
					content: z.string(),
					pinned: z.boolean(),
					deletedAt: z.string().optional(),
					createdAt: z.string(),
					updatedAt: z.string(),
				}),
			),
			reminders: z.array(
				z.object({
					id: z.string(),
					text: z.string(),
					dueAt: z.string().optional(),
					deletedAt: z.string().optional(),
					createdAt: z.string(),
					updatedAt: z.string(),
				}),
			),
		}),
	]),
})

type _GetPersonDetailsTool = InferUITool<typeof getPersonDetailsTool>

async function getPersonDetailsExecute(
	_userId: string,
	input: _GetPersonDetailsTool["input"],
): Promise<_GetPersonDetailsTool["output"]> {
	let fullPerson = await Person.load(input.personId, {
		resolve: {
			reminders: { $each: true },
			notes: { $each: true },
		},
	})

	if (!fullPerson) {
		return { error: `Person with ID "${input.personId}" not found` }
	}

	let filteredNotes =
		fullPerson.notes?.filter(n => {
			if (!n) return false
			if (isPermanentlyDeleted(n)) return false
			if (!input.includeDeletedNotes && isDeleted(n)) return false
			return true
		}) || []

	let filteredReminders =
		fullPerson.reminders?.filter(r => {
			if (!r) return false
			if (isPermanentlyDeleted(r)) return false
			if (!input.includeDeletedReminders && isDeleted(r)) return false
			if (!input.includeDeletedReminders && r.done) return false
			return true
		}) || []

	if (input.search) {
		let searchLower = input.search.toLowerCase()
		filteredNotes = filteredNotes.filter(note =>
			note.content.toLowerCase().includes(searchLower),
		)
		filteredReminders = filteredReminders.filter(reminder =>
			reminder.text.toLowerCase().includes(searchLower),
		)
	}

	return {
		personId: fullPerson.$jazz.id,
		name: fullPerson.name,
		summary: fullPerson.summary,
		deletedAt: fullPerson.deletedAt?.toISOString(),
		notes: filteredNotes.map(n => ({
			id: n.$jazz.id,
			title: n.title || "",
			content: n.content,
			pinned: n.pinned || false,
			deletedAt: n.deletedAt?.toISOString(),
			createdAt: n.createdAt.toISOString(),
			updatedAt: n.updatedAt.toISOString(),
		})),
		reminders: filteredReminders.map(r => ({
			id: r.$jazz.id,
			text: r.text,
			dueAt: r.dueAtDate,
			deletedAt: r.deletedAt?.toISOString(),
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
		})),
	}
}
