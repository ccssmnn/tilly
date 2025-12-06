import { Group, Account, co, type ID } from "jazz-tools"
import { createInviteLink } from "jazz-tools/browser"
import { Person, Note, Reminder, UserAccount } from "#shared/schema/user"

export { createPersonInviteLink, getPersonCollaborators, removeCollaborator }
export type { Collaborator }

async function createPersonInviteLink(
	person: LoadedPerson,
	userId: string,
): Promise<string> {
	let group = getPersonGroup(person)

	// Check admin permission on existing group
	if (group) {
		let myRole = group.myRole()
		if (myRole !== "admin") {
			throw new Error("Only admins can create invite links")
		}
		return createInviteLink(person, "writer", { valueHint: "person" })
	}

	// Migrate to group (creator becomes admin)
	await migratePersonToGroup(person, userId)

	// Re-load person to get the new group-owned version
	let account = await UserAccount.load(userId, {
		resolve: {
			root: {
				people: {
					$each: { notes: { $each: true }, reminders: { $each: true } },
				},
			},
		},
	})
	if (!account?.$isLoaded) throw new Error("User account not found")

	let newPerson = account.root.people.find(
		p => p?.name === person.name && !p.permanentlyDeletedAt,
	)
	if (!newPerson) throw new Error("Migrated person not found")

	return createInviteLink(newPerson, "writer", { valueHint: "person" })
}

async function getPersonCollaborators(
	person: co.loaded<typeof Person>,
): Promise<Collaborator[]> {
	let group = getPersonGroup(person)
	if (!group) return []

	let collaborators: Collaborator[] = []
	for (let member of group.members) {
		if (
			member.role === "admin" ||
			member.role === "writer" ||
			member.role === "reader"
		) {
			let account = member.account
			let name = "Unknown"
			if (account?.$isLoaded) {
				let profile = await account.$jazz.ensureLoaded({
					resolve: { profile: true },
				})
				name = profile.profile?.name ?? "Unknown"
			}
			collaborators.push({
				id: member.id,
				role: member.role,
				name,
			})
		}
	}
	return collaborators
}

async function removeCollaborator(
	person: co.loaded<typeof Person>,
	accountId: ID<Account>,
): Promise<void> {
	let group = getPersonGroup(person)
	if (!group) throw new Error("Person is not group-owned")

	let member = group.members.find(m => m.id === accountId)
	if (!member) throw new Error("Collaborator not found")

	group.removeMember(member.account)
}

type LoadedPerson = co.loaded<
	typeof Person,
	{ notes: { $each: true }; reminders: { $each: true } }
>
type Collaborator = {
	id: string
	role: "admin" | "writer" | "reader" | "writeOnly"
	name: string
}

function getPersonGroup(person: co.loaded<typeof Person>): Group | null {
	let group = person.$jazz.owner
	if (!group || !(group instanceof Group)) return null
	return group
}

function isGroupOwned(person: co.loaded<typeof Person>): boolean {
	return getPersonGroup(person) !== null
}

async function migratePersonToGroup(
	person: LoadedPerson,
	userId: string,
): Promise<Group> {
	if (isGroupOwned(person)) {
		return getPersonGroup(person)!
	}

	let group = Group.create()

	let now = new Date()
	let newPerson = Person.create(
		{
			version: 1,
			name: person.name,
			summary: person.summary,
			notes: co.list(Note).create([], group),
			reminders: co.list(Reminder).create([], group),
			createdAt: person.createdAt ?? now,
			updatedAt: now,
		},
		group,
	)

	// Copy avatar if present - use type assertion due to jazz image types
	if (person.avatar) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		newPerson.$jazz.set("avatar", person.avatar as any)
	}

	// Copy notes
	for (let note of person.notes.values()) {
		if (!note) continue
		let newNote = Note.create(
			{
				version: 1,
				title: note.title,
				content: note.content,
				pinned: note.pinned,
				deletedAt: note.deletedAt,
				permanentlyDeletedAt: note.permanentlyDeletedAt,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			},
			group,
		)
		newPerson.notes.$jazz.push(newNote)
	}

	// Copy reminders
	for (let reminder of person.reminders.values()) {
		if (!reminder) continue
		let newReminder = Reminder.create(
			{
				version: 1,
				text: reminder.text,
				dueAtDate: reminder.dueAtDate,
				repeat: reminder.repeat,
				done: reminder.done,
				deletedAt: reminder.deletedAt,
				permanentlyDeletedAt: reminder.permanentlyDeletedAt,
				createdAt: reminder.createdAt,
				updatedAt: reminder.updatedAt,
			},
			group,
		)
		newPerson.reminders.$jazz.push(newReminder)
	}

	// Replace old person with new in user's list
	let account = await UserAccount.load(userId, {
		resolve: { root: { people: true } },
	})
	if (!account?.$isLoaded) throw new Error("User account not found")

	let idx = account.root.people.findIndex(p => p?.$jazz.id === person.$jazz.id)
	if (idx !== -1) {
		account.root.people.$jazz.set(idx, newPerson)
	}

	// Mark old person as deleted
	person.$jazz.set("permanentlyDeletedAt", now)

	return group
}
