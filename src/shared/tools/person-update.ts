import { tool } from "ai"
import { z } from "zod"
import { Person, UserAccount, UserAccountRoot } from "#shared/schema/user"
import { co, type Loaded, type ResolveQuery } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import {
	moveToActive,
	moveToInactive,
	removeFromInactive,
} from "#shared/lib/jazz-list-utils"

export { createUpdatePersonTool, createDeletePersonTool, updatePerson }

export type { PersonData, PersonUpdated }

let rootResolve = {
	people: { $each: true },
	inactivePeople: { $each: true },
} as const satisfies ResolveQuery<typeof UserAccountRoot>

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
	worker: Loaded<typeof UserAccount>,
): Promise<PersonUpdated> {
	let person = await Person.load(personId, { loadAs: worker })
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let { root } = await worker.$jazz.ensureLoaded({
		resolve: { root: rootResolve },
	})

	if (!root.inactivePeople) {
		root.$jazz.set("inactivePeople", co.list(Person).create([]))
	}

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
		moveToActive(root.people, root.inactivePeople, personId)
	}

	if (updates.deletedAt !== undefined) {
		person.$jazz.set("deletedAt", updates.deletedAt)
		moveToInactive(root.people, root.inactivePeople, personId)
	}

	if (updates.permanentlyDeletedAt !== undefined) {
		person.$jazz.set("permanentlyDeletedAt", updates.permanentlyDeletedAt)
		removeFromInactive(root.inactivePeople, personId)
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

function createUpdatePersonTool(worker: Loaded<typeof UserAccount>) {
	return tool({
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
		execute: async input => {
			let { personId, ...updates } = input

			try {
				let result = await updatePerson(personId, updates, worker)
				let { _ref, ...data } = result

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
						deletedAt: _ref.deletedAt?.toISOString(),
						createdAt: _ref.createdAt.toISOString(),
						updatedAt: _ref.updatedAt.toISOString(),
					},
				}
			} catch (error) {
				return { error: `${error}` }
			}
		},
	})
}

function createDeletePersonTool(worker: Loaded<typeof UserAccount>) {
	return tool({
		description:
			"Delete a person from the CRM by marking them as deleted (soft delete). Use updatePerson to restore deleted people.",
		inputSchema: z.object({
			personId: z.string().describe("The person's ID to delete"),
		}),
		execute: async input => {
			try {
				let result = await updatePerson(
					input.personId,
					{ deletedAt: new Date() },
					worker,
				)
				let { _ref, ...data } = result

				return {
					personId: data.personID,
					name: data.current.name,
					summary: data.current.summary,
					deletedAt: _ref.deletedAt?.toISOString(),
					createdAt: _ref.createdAt.toISOString(),
					updatedAt: _ref.updatedAt.toISOString(),
				}
			} catch (error) {
				return { error: `${error}` }
			}
		},
	})
}
