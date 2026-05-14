import { Group, co } from "jazz-tools"
import { createJazzTestAccount } from "jazz-tools/testing"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"

export { createAccount, seedPerson, seedNote, seedReminder }

async function createAccount(opts: { isCurrentActive?: boolean } = {}) {
	return await createJazzTestAccount({
		isCurrentActiveAccount: opts.isCurrentActive ?? false,
		AccountSchema: UserAccount,
	})
}

async function seedPerson(
	account: co.loaded<typeof UserAccount>,
	args: {
		name: string
		summary?: string
		sharedWith?: co.loaded<typeof UserAccount>
	},
) {
	let { root } = await account.$jazz.ensureLoaded({
		resolve: { root: { people: true } },
	})

	let group = Group.create()
	if (args.sharedWith) {
		group.addMember(args.sharedWith, "writer")
	}

	let now = new Date()
	let person = Person.create(
		{
			version: 1,
			name: args.name,
			summary: args.summary,
			notes: co.list(Note).create([], group),
			reminders: co.list(Reminder).create([], group),
			createdAt: now,
			updatedAt: now,
		},
		group,
	)
	root.people.$jazz.push(person)
	return person
}

async function seedNote(
	person: co.loaded<typeof Person>,
	args: { content: string; pinned?: boolean; title?: string; deletedAt?: Date },
) {
	let loaded = await person.$jazz.ensureLoaded({ resolve: { notes: true } })
	let now = new Date()
	let note = Note.create(
		{
			version: 1,
			title: args.title,
			content: args.content,
			pinned: args.pinned ?? false,
			deletedAt: args.deletedAt,
			createdAt: now,
			updatedAt: now,
		},
		loaded.$jazz.owner,
	)
	loaded.notes.$jazz.push(note)
	return note
}

async function seedReminder(
	person: co.loaded<typeof Person>,
	args: {
		text: string
		dueAtDate: string
		done?: boolean
		deletedAt?: Date
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	},
) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: { reminders: true },
	})
	let now = new Date()
	let reminder = Reminder.create(
		{
			version: 1,
			text: args.text,
			dueAtDate: args.dueAtDate,
			done: args.done ?? false,
			repeat: args.repeat,
			deletedAt: args.deletedAt,
			createdAt: now,
			updatedAt: now,
		},
		loaded.$jazz.owner,
	)
	loaded.reminders.$jazz.push(reminder)
	return reminder
}
