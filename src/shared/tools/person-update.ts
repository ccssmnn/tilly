import { tool } from "ai"
import { z } from "zod"
import { Person, UserAccount } from "#shared/schema/user"
import { co, type Loaded } from "jazz-tools"
import { createImage } from "jazz-tools/media"

export { createUpdatePersonTool, createDeletePersonTool, updatePerson }

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
	worker: Loaded<typeof UserAccount>,
): Promise<PersonUpdated> {
	let person = await Person.load(personId, { loadAs: worker })
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	// Ensure worker has inactive people array
	if (worker.root.$isLoaded && !worker.root.inactivePeople) {
		worker.root.$jazz.set("inactivePeople", co.list(Person).create([]))
	}

	// Find person in active or inactive array
	let personInActive = -1
	let personInInactive = -1

	if (worker.root.$isLoaded && worker.root.people.$isLoaded) {
		personInActive = Array.from(worker.root.people.values()).findIndex(
			p => p?.$jazz.id === personId,
		)
	}

	if (worker.root.$isLoaded && worker.root.inactivePeople?.$isLoaded) {
		personInInactive = Array.from(worker.root.inactivePeople.values()).findIndex(
			p => p?.$jazz.id === personId,
		)
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

	// Handle deletedAt changes
	if ("deletedAt" in updates && updates.deletedAt === undefined) {
		person.$jazz.delete("deletedAt")
		// Restore: move from inactive to active
		if (
			personInInactive !== -1 &&
			worker.root.$isLoaded &&
			worker.root.people.$isLoaded &&
			worker.root.inactivePeople?.$isLoaded
		) {
			worker.root.people.$jazz.push(person)
			worker.root.inactivePeople.$jazz.splice(personInInactive, 1)
		}
	}

	if (updates.deletedAt !== undefined) {
		person.$jazz.set("deletedAt", updates.deletedAt)
		// Move to inactive if in active array
		if (
			personInActive !== -1 &&
			worker.root.$isLoaded &&
			worker.root.inactivePeople?.$isLoaded &&
			worker.root.people.$isLoaded
		) {
			worker.root.inactivePeople.$jazz.push(person)
			worker.root.people.$jazz.splice(personInActive, 1)
		}
	}

	// Handle permanent deletion
	if (updates.permanentlyDeletedAt !== undefined) {
		person.$jazz.set("permanentlyDeletedAt", updates.permanentlyDeletedAt)
		// Remove from inactive array
		if (
			personInInactive !== -1 &&
			worker.root.$isLoaded &&
			worker.root.inactivePeople?.$isLoaded
		) {
			worker.root.inactivePeople.$jazz.splice(personInInactive, 1)
		}
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
