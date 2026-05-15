import { z } from "zod"
import { co, type ResolveQuery } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import { Person, UserAccountRoot } from "#shared/schema/user"
import {
	defineTool,
	updatedSchema,
	type Updated,
	type Worker,
} from "#shared/tools/define-tool"
import { personCurrent } from "#shared/tools/person-create"

export { updatePerson, createUpdatePersonTool, createDeletePersonTool }

type PersonCurrent = z.infer<typeof personCurrent>

let updatePersonInput = z.object({
	personId: z.string().describe("The person's ID"),
	name: z.string().optional().describe("The person's new name"),
	summary: z
		.string()
		.optional()
		.describe(
			"A compact summary displayed next to the person's name and avatar. Should include key details like relationship, profession, location, and personality traits. Example: 'sister in law, doctor, lives in switzerland with erik, high energy and positivity'",
		),
})

type UpdatePersonInput = z.infer<typeof updatePersonInput> & {
	deletedAt?: Date | undefined
	avatarFile?: File | null
}

async function updatePerson(
	worker: Worker,
	input: UpdatePersonInput,
): Promise<Updated<PersonCurrent>> {
	let person = await Person.load(input.personId, { loadAs: worker })
	if (!person.$isLoaded) throw errors.PERSON_NOT_FOUND

	let { root } = await worker.$jazz.ensureLoaded({
		resolve: { root: rootResolve },
	})

	if (!root.inactivePeople) {
		root.$jazz.set("inactivePeople", co.list(Person).create([]))
	}

	let previous: PersonCurrent = serializePerson(person)

	if (input.name !== undefined) {
		person.$jazz.set("name", input.name)
	}
	if (input.summary !== undefined) {
		person.$jazz.set("summary", input.summary)
	}

	if ("deletedAt" in input && input.deletedAt === undefined) {
		person.$jazz.delete("deletedAt")
		if (root.inactivePeople) {
			let inactiveIdx = Array.from(root.inactivePeople.values()).findIndex(
				p => p?.$jazz.id === input.personId,
			)
			if (inactiveIdx !== -1) {
				root.people.$jazz.push(person)
				root.inactivePeople.$jazz.splice(inactiveIdx, 1)
			}
		}
	}

	if (input.deletedAt !== undefined) {
		person.$jazz.set("deletedAt", input.deletedAt)
		if (root.inactivePeople) {
			let activeIdx = Array.from(root.people.values()).findIndex(
				p => p?.$jazz.id === input.personId,
			)
			if (activeIdx !== -1) {
				root.inactivePeople.$jazz.push(person)
				root.people.$jazz.splice(activeIdx, 1)
			}
		}
	}

	if (input.avatarFile !== undefined) {
		if (input.avatarFile === null) {
			person.$jazz.delete("avatar")
		} else {
			let avatar = await createImage(input.avatarFile, {
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
		current: serializePerson(person),
		previous,
	}
}

function serializePerson(person: co.loaded<typeof Person>): PersonCurrent {
	return {
		personId: person.$jazz.id,
		name: person.name,
		summary: person.summary,
		createdAt: person.createdAt.toISOString(),
		updatedAt: person.updatedAt.toISOString(),
		deletedAt: person.deletedAt?.toISOString(),
	}
}

let rootResolve = {
	people: { $each: true },
	inactivePeople: { $each: true },
} as const satisfies ResolveQuery<typeof UserAccountRoot>

let errors = {
	PERSON_NOT_FOUND: "person not found",
} as const

let createUpdatePersonTool = defineTool({
	description:
		"Update a person's name and/or summary. Can also restore deleted people by updating their information.",
	input: updatePersonInput,
	output: updatedSchema(personCurrent),
	serverOp: updatePerson,
})

let deletePersonInput = z.object({
	personId: z.string().describe("The person's ID to delete"),
})

let createDeletePersonTool = defineTool({
	description:
		"Delete a person from the CRM by marking them as deleted (soft delete). Use updatePerson to restore deleted people.",
	input: deletePersonInput,
	output: updatedSchema(personCurrent),
	serverOp: (worker, input) =>
		updatePerson(worker, { ...input, deletedAt: new Date() }),
})
