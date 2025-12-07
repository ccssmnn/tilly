import { Group, Account, co, type ID } from "jazz-tools"
import { createInviteLink } from "jazz-tools/browser"
import { Person, Note, Reminder, UserAccount } from "#shared/schema/user"

export {
	createPersonInviteLink,
	getPersonCollaborators,
	removeCollaborator,
	getPersonOwnerName,
}
export type { Collaborator }

async function createPersonInviteLink(
	person: LoadedPerson,
	userId: string,
): Promise<string> {
	let group = getPersonGroup(person)

	// Base URL for invite route
	let baseURL = `${window.location.origin}/app/invite`

	// Check admin permission on existing group
	if (group) {
		let myRole = group.myRole()
		if (myRole !== "admin") {
			throw new Error("Only admins can create invite links")
		}

		// Ensure nested lists are also group-owned
		// This handles cases where Person is group-owned but lists aren't
		let needsMigration = !areNestedListsGroupOwned(person, group)
		if (needsMigration) {
			await migrateNestedListsToGroup(person, group)
		}

		return createInviteLink(person, "writer", { valueHint: "person", baseURL })
	}

	// Migrate to group (creator becomes admin)
	await migratePersonToGroup(person, userId)

	// Re-load person to get the new group-owned version
	let account = await UserAccount.load(userId, {
		resolve: {
			root: {
				people: {
					$each: {
						notes: { $each: true },
						reminders: { $each: true },
						inactiveNotes: { $each: true },
						inactiveReminders: { $each: true },
					},
				},
			},
		},
	})
	if (!account?.$isLoaded) throw new Error("User account not found")

	let newPerson = account.root.people.find(
		p => p?.name === person.name && !p.permanentlyDeletedAt,
	)
	if (!newPerson) throw new Error("Migrated person not found")

	return createInviteLink(newPerson, "writer", { valueHint: "person", baseURL })
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
	{
		notes: { $each: true }
		reminders: { $each: true }
		inactiveNotes: { $each: true }
		inactiveReminders: { $each: true }
	}
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

async function getPersonOwnerName(
	person: co.loaded<typeof Person>,
): Promise<string | null> {
	let group = getPersonGroup(person)
	if (!group) return null

	let admin = group.members.find(m => m.role === "admin")
	if (!admin?.account?.$isLoaded) return null

	let profile = await admin.account.$jazz.ensureLoaded({
		resolve: { profile: true },
	})
	return profile.profile?.name ?? null
}

function isGroupOwned(person: co.loaded<typeof Person>): boolean {
	return getPersonGroup(person) !== null
}

function areNestedListsGroupOwned(person: LoadedPerson, group: Group): boolean {
	let groupId = group.$jazz.id

	function isOwnedByGroup(
		list: { $jazz: { owner: unknown } } | undefined,
	): boolean {
		if (!list) return true // Optional lists that don't exist are fine
		let owner = list.$jazz.owner
		return owner instanceof Group && owner.$jazz.id === groupId
	}

	return (
		isOwnedByGroup(person.notes) &&
		isOwnedByGroup(person.reminders) &&
		isOwnedByGroup(person.inactiveNotes) &&
		isOwnedByGroup(person.inactiveReminders)
	)
}

async function migrateNestedListsToGroup(
	person: LoadedPerson,
	group: Group,
): Promise<void> {
	let groupId = group.$jazz.id

	// Helper to check if a list needs migration
	function needsMigration(
		list: { $jazz: { owner: unknown } } | undefined,
	): boolean {
		if (!list) return false
		let owner = list.$jazz.owner
		return !(owner instanceof Group && owner.$jazz.id === groupId)
	}

	// Migrate notes if needed
	if (needsMigration(person.notes)) {
		let newNotes = co.list(Note).create([], group)
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
			newNotes.$jazz.push(newNote)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("notes", newNotes as any)
	}

	// Migrate reminders if needed
	if (needsMigration(person.reminders)) {
		let newReminders = co.list(Reminder).create([], group)
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
			newReminders.$jazz.push(newReminder)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("reminders", newReminders as any)
	}

	// Migrate inactiveNotes if needed
	if (person.inactiveNotes && needsMigration(person.inactiveNotes)) {
		let newInactiveNotes = co.list(Note).create([], group)
		for (let note of person.inactiveNotes.values()) {
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
			newInactiveNotes.$jazz.push(newNote)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("inactiveNotes", newInactiveNotes as any)
	}

	// Migrate inactiveReminders if needed
	if (person.inactiveReminders && needsMigration(person.inactiveReminders)) {
		let newInactiveReminders = co.list(Reminder).create([], group)
		for (let reminder of person.inactiveReminders.values()) {
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
			newInactiveReminders.$jazz.push(newReminder)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("inactiveReminders", newInactiveReminders as any)
	}
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
