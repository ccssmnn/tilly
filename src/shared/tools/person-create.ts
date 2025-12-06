import { tool, type InferUITool } from "ai"
import { z } from "zod"
import { Person, Note, UserAccount, Reminder } from "#shared/schema/user"
import { co, Group } from "jazz-tools"
import { createImage } from "jazz-tools/media"
import { tryCatch } from "#shared/lib/trycatch"

export { createPersonTool, createPersonExecute, createPerson }

export type { PersonData, PersonCreated }

async function createPerson(
	userId: string,
	data: Omit<PersonData, "version" | "notes" | "reminders"> & {
		avatarFile?: File | null
	},
): Promise<PersonCreated> {
	let account = await UserAccount.load(userId, {
		resolve: { root: { people: { $each: true } } },
	})
	if (!account.$isLoaded) throw errors.USER_ACCOUNT_NOT_FOUND

	let now = new Date()
	let group = Group.create()
	let person = Person.create(
		{
			version: 1,
			name: data.name,
			summary: data.summary,
			notes: co.list(Note).create([], group),
			reminders: co.list(Reminder).create([], group),
			createdAt: now,
			updatedAt: now,
		},
		group,
	)

	if (data.avatarFile) {
		try {
			let avatar = await createImage(data.avatarFile, {
				owner: group,
				maxSize: 2048,
				placeholder: "blur",
				progressive: true,
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			person.$jazz.set("avatar", avatar as any) // TODO: is this an error on the jazz side of things?
		} catch (error) {
			console.warn("Failed to create avatar:", error)
		}
	} else if (data.avatarFile === null) {
		person.$jazz.delete("avatar")
	}

	account.root.people.$jazz.push(person)

	return {
		operation: "create",
		personID: person.$jazz.id,
		current: {
			name: person.name,
			summary: person.summary,
			version: 1,
		},
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

type PersonCreated = {
	_ref: co.loaded<typeof Person>
	operation: "create"
	personID: string
	current: PersonData
}

let createPersonTool = tool({
	description: "Create a new person in the CRM",
	inputSchema: z.object({
		name: z.string().describe("The person's name"),
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
			cancelled: z.literal(true),
			reason: z.string(),
		}),
		z.object({
			personId: z.string(),
			name: z.string(),
			summary: z.string().optional(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
	]),
})

type _CreatePersonTool = InferUITool<typeof createPersonTool>

async function createPersonExecute(
	userId: string,
	input: _CreatePersonTool["input"],
): Promise<_CreatePersonTool["output"]> {
	let res = await tryCatch(createPerson(userId, input))
	if (!res.ok) return { error: String(res.error) }
	let { _ref, ...data } = res.data
	return {
		personId: data.personID,
		name: data.current.name,
		summary: data.current.summary,
		createdAt: _ref.createdAt.toISOString(),
		updatedAt: _ref.updatedAt.toISOString(),
	}
}
