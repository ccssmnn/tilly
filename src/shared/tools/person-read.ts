import { tool } from "ai"
import { z } from "zod"
import { co, type Loaded } from "jazz-tools"
import {
	Person,
	UserAccount,
	isDeleted,
	isPermanentlyDeleted,
} from "#shared/schema/user"

export { createListPeopleTool, createGetPersonDetailsTool }

function createListPeopleTool(worker: Loaded<typeof UserAccount>) {
	return tool({
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
		execute: async input => {
			let me = await worker.$jazz.ensureLoaded({
				resolve: {
					root: { people: { $each: true }, inactivePeople: { $each: true } },
				},
			})
			if (!me.root.people) {
				return { error: "No people data available" }
			}

			// Merge active and inactive people when includeDeleted is true
			let peopleToSearch = input.includeDeleted
				? [...me.root.people, ...(me.root.inactivePeople || [])]
				: me.root.people

			let allPeople = peopleToSearch
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

			return { people, count: people.length, searchQuery: input.search }
		},
	})
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

function createGetPersonDetailsTool(worker: Loaded<typeof UserAccount>) {
	return tool({
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
		execute: async input => {
			let fullPerson = await Person.load(input.personId, {
				resolve: {
					reminders: { $each: true },
					notes: { $each: true },
				},
				loadAs: worker,
			})

			if (!fullPerson.$isLoaded) {
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
					dueAtDate: r.dueAtDate,
					deletedAt: r.deletedAt?.toISOString(),
					createdAt: r.createdAt.toISOString(),
					updatedAt: r.updatedAt.toISOString(),
				})),
			}
		},
	})
}
