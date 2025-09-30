import { tool, type InferUITool } from "ai"
import { z } from "zod"
import { Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import { tryCatch } from "#shared/lib/trycatch"

export {
	updatePersonTool,
	updatePersonExecute,
	deletePersonTool,
	deletePersonExecute,
	updatePerson,
}

export type { PersonData, PersonUpdated }

async function updatePerson(
	personId: string,
	updates: Partial<
		Pick<PersonData, "name" | "summary"> & {
			deletedAt: Date | undefined
			permanentlyDeletedAt: Date | undefined
		}
	> & {
		avatarFile?: File | null
	},
): Promise<PersonUpdated> {
	let person = await Person.load(personId)
	if (!person) throw errors.PERSON_NOT_FOUND

	let previous = {
		name: person.name,
		summary: person.summary,
		version: person.version,
	}

	if (updates.name !== undefined) {
		person.$jazz.set("name", updates.name)
	}
	if (updates.summary !== undefined) {
		person.$jazz.set("summary", updates.summary)
	}

	if ("deletedAt" in updates && updates.deletedAt === undefined) {
		person.$jazz.delete("deletedAt")
	}

	if (updates.deletedAt !== undefined) {
		person.$jazz.set("deletedAt", updates.deletedAt)
	}

	if (updates.permanentlyDeletedAt !== undefined) {
		person.$jazz.set("permanentlyDeletedAt", updates.permanentlyDeletedAt)
	}

	if (updates.avatarFile !== undefined) {
		if (updates.avatarFile === null) {
			person.$jazz.delete("avatar")
		} else {
			let avatar = await createImage(updates.avatarFile, {
				owner: person.$jazz.owner,
				maxSize: 2048,
				placeholder: "blur",
				progressive: true,
			})
			person.$jazz.set("avatar", avatar)
		}
	}

	person.$jazz.set("updatedAt", new Date())

	return {
		operation: "update",
		personID: personId,
		current: {
			name: person.name,
			summary: person.summary,
			version: person.version,
		},
		previous,
		_ref: person,
	}
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
	USER_ACCOUNT_NOT_FOUND: "user account not found",
} as const

type PersonData = {
	name: string
	summary?: string
	version: number
}

type PersonUpdated = {
	_ref: co.loaded<typeof Person>
	operation: "update"
	personID: string
	current: PersonData
	previous: PersonData
}

let updatePersonTool = tool({
	description:
		"Update a person's name and/or summary. Can also restore deleted people by updating their information.",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID"),
		name: z.string().optional().describe("The person's new name"),
		summary: z
			.string()
			.optional()
			.describe(
				"A compact summary displayed next to the person's name and avatar. Should include key details like relationship, profession, location, and personality traits. Example: 'sister in law, doctor, lives in switzerland with erik, high energy and positivity'",
			),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			personId: z.string(),
			current: z.object({
				name: z.string(),
				summary: z.string().optional(),
				deletedAt: z.string().optional(),
				createdAt: z.string(),
				updatedAt: z.string(),
			}),
			previous: z.object({
				name: z.string(),
				summary: z.string().optional(),
				deletedAt: z.string().optional(),
				createdAt: z.string().optional(),
				updatedAt: z.string().optional(),
			}),
		}),
	]),
})

type _UpdatePersonTool = InferUITool<typeof updatePersonTool>

async function updatePersonExecute(
	_userId: string,
	input: _UpdatePersonTool["input"],
): Promise<_UpdatePersonTool["output"]> {
	let { personId, ...updates } = input
	let res = await tryCatch(updatePerson(personId, updates))
	if (!res.ok) return { error: `${res.error}` }
	let { _ref, ...data } = res.data
	return {
		personId: data.personID,
		current: {
			name: data.current.name,
			summary: data.current.summary,
			deletedAt: _ref.deletedAt?.toISOString(),
			createdAt: _ref.createdAt.toISOString(),
			updatedAt: _ref.updatedAt.toISOString(),
		},
		previous: {
			name: data.previous.name,
			summary: data.previous.summary,
			// TODO: why are we setting deleted created and updated from the same ref in this output?
			deletedAt: _ref.deletedAt?.toISOString(),
			createdAt: _ref.createdAt.toISOString(),
			updatedAt: _ref.updatedAt.toISOString(),
		},
	}
}

let deletePersonTool = tool({
	description:
		"Delete a person from the CRM by marking them as deleted (soft delete). Use updatePersonTool to restore deleted people.",
	inputSchema: z.object({
		personId: z.string().describe("The person's ID to delete"),
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
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	]),
})

type _DeletePersonTool = InferUITool<typeof deletePersonTool>

async function deletePersonExecute(
	_userId: string,
	input: _DeletePersonTool["input"],
): Promise<_DeletePersonTool["output"]> {
	let res = await tryCatch(
		updatePerson(input.personId, { deletedAt: new Date() }),
	)
	if (!res.ok) return { error: `${res.error}` }
	let { _ref, ...data } = res.data
	return {
		personId: data.personID,
		name: data.current.name,
		summary: data.current.summary,
		deletedAt: _ref.deletedAt?.toISOString(),
		createdAt: _ref.createdAt.toISOString(),
		updatedAt: _ref.updatedAt.toISOString(),
	}
}
