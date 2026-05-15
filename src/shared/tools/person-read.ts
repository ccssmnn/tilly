import { z } from "zod"
import { co } from "jazz-tools"
import { Person, isDeleted } from "#shared/schema/user"
import { defineTool, type Worker } from "#shared/tools/define-tool"

export {
	listPeople,
	getPersonDetails,
	createListPeopleTool,
	createGetPersonDetailsTool,
}

let personListItem = z.object({
	id: z.string(),
	name: z.string(),
	summary: z.string().nullable(),
	deletedAt: z.date().optional(),
})

let listPeopleInput = z.object({
	search: z
		.string()
		.optional()
		.describe("Optional search query to filter people by names and summaries"),
	includeDeleted: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include deleted people in results"),
})

let listPeopleOutput = z.object({
	people: z.array(personListItem),
	count: z.number(),
	searchQuery: z.string().optional(),
})

async function listPeople(
	worker: Worker,
	input: z.infer<typeof listPeopleInput>,
): Promise<z.infer<typeof listPeopleOutput>> {
	let me = await worker.$jazz.ensureLoaded({
		resolve: {
			root: { people: { $each: true }, inactivePeople: { $each: true } },
		},
	})
	if (!me.root.people) throw new Error("No people data available")

	let peopleToSearch = input.includeDeleted
		? [...me.root.people, ...(me.root.inactivePeople || [])]
		: me.root.people

	let allPeople = peopleToSearch
		.filter(person => person != null)
		.filter(person => input.includeDeleted || !isDeleted(person))

	let matched = input.search ? searchPeople(allPeople, input.search) : allPeople

	let people = matched.map(person => ({
		id: person.$jazz.id,
		name: person.name,
		summary: person.summary || null,
		deletedAt: person.deletedAt,
	}))

	return { people, count: people.length, searchQuery: input.search }
}

let createListPeopleTool = defineTool({
	description:
		"List people with their ID, name, and summary. Optionally search people by names and summaries.",
	input: listPeopleInput,
	output: listPeopleOutput,
	serverOp: listPeople,
})

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

let getPersonDetailsInput = z.object({
	personId: z
		.string()
		.describe("The unique ID of the person to retrieve details for"),
	search: z
		.string()
		.optional()
		.describe("Optional search query to filter notes and reminders by content"),
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
})

let personDetailsOutput = z.object({
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
			dueAtDate: z.string(),
			deletedAt: z.string().optional(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	),
})

async function getPersonDetails(
	worker: Worker,
	input: z.infer<typeof getPersonDetailsInput>,
): Promise<z.infer<typeof personDetailsOutput>> {
	let fullPerson = await Person.load(input.personId, {
		resolve: {
			reminders: { $each: true },
			notes: { $each: true },
		},
		loadAs: worker,
	})
	if (!fullPerson.$isLoaded)
		throw new Error(`Person with ID "${input.personId}" not found`)

	let filteredNotes =
		fullPerson.notes?.filter(n => {
			if (!n) return false
			if (!input.includeDeletedNotes && isDeleted(n)) return false
			return true
		}) || []

	let filteredReminders =
		fullPerson.reminders?.filter(r => {
			if (!r) return false
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
			dueAtDate: r.dueAtDate,
			deletedAt: r.deletedAt?.toISOString(),
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
		})),
	}
}

let createGetPersonDetailsTool = defineTool({
	description:
		"Get detailed information for a specific person by their ID. Returns the person's full data including all notes and reminders. Optionally filter notes and reminders using a search query.",
	input: getPersonDetailsInput,
	output: personDetailsOutput,
	serverOp: getPersonDetails,
})
