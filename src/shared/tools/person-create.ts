import { z } from "zod"
import { Group, co } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import { Person, Note, Reminder } from "#shared/schema/user"
import {
	defineTool,
	createdSchema,
	type Created,
	type Worker,
} from "#shared/tools/define-tool"

export { createPerson, createPersonTool, personCurrent }

let personCurrent = z.object({
	personId: z.string(),
	name: z.string(),
	summary: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	deletedAt: z.string().optional(),
})

type PersonCurrent = z.infer<typeof personCurrent>

let createPersonInput = z.object({
	name: z.string().describe("The person's name"),
	summary: z
		.string()
		.optional()
		.describe(
			"A compact summary displayed next to the person's name and avatar. Should include key details like relationship, profession, location, and personality traits. Example: 'sister in law, doctor, lives in switzerland with erik, high energy and positivity'",
		),
})

type CreatePersonInput = z.infer<typeof createPersonInput> & {
	avatarFile?: File | null
}

async function createPerson(
	worker: Worker,
	input: CreatePersonInput,
): Promise<Created<PersonCurrent>> {
	let account = await worker.$jazz.ensureLoaded({
		resolve: { root: { people: { $each: true } } },
	})
	if (!account.$isLoaded) throw errors.USER_ACCOUNT_NOT_FOUND

	let now = new Date()
	let group = Group.create()
	let person = Person.create(
		{
			version: 1,
			name: input.name,
			summary: input.summary,
			notes: co.list(Note).create([], group),
			reminders: co.list(Reminder).create([], group),
			createdAt: now,
			updatedAt: now,
		},
		group,
	)

	if (input.avatarFile) {
		try {
			let avatar = await createImage(input.avatarFile, {
				owner: group,
				maxSize: 2048,
				placeholder: "blur",
				progressive: true,
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			person.$jazz.set("avatar", avatar as any)
		} catch (error) {
			console.warn("Failed to create avatar:", error)
		}
	} else if (input.avatarFile === null) {
		person.$jazz.delete("avatar")
	}

	account.root.people.$jazz.push(person)

	return {
		operation: "create",
		current: {
			personId: person.$jazz.id,
			name: person.name,
			summary: person.summary,
			createdAt: person.createdAt.toISOString(),
			updatedAt: person.updatedAt.toISOString(),
		},
	}
}

let errors = {
	USER_ACCOUNT_NOT_FOUND: "user account not found",
} as const

let createPersonTool = defineTool({
	description: "Create a new person in the CRM",
	input: createPersonInput,
	output: createdSchema(personCurrent),
	cancellable: true,
})
