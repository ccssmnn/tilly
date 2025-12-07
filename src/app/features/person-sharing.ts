import { Group, Account, co, type ID } from "jazz-tools"
import { Person, Note, Reminder, UserAccount } from "#shared/schema/user"

export {
	createPersonInviteLink,
	getPersonCollaborators,
	removeCollaborator,
	removeInviteGroup,
	getPersonOwnerName,
	getInviteGroupsWithMembers,
	cleanupEmptyInviteGroups,
}
export type { Collaborator, InviteGroupWithMembers }

async function createPersonInviteLink(
	person: LoadedPerson,
	userId: string,
): Promise<string> {
	let personGroup = getPersonGroup(person)

	// Base URL for invite route
	let baseURL = `${window.location.origin}/app/invite`

	// Check admin permission on existing group
	if (personGroup) {
		let myRole = personGroup.myRole()
		if (myRole !== "admin") {
			throw new Error("Only admins can create invite links")
		}

		// Ensure nested lists are also group-owned
		let needsMigration = !areNestedListsGroupOwned(person, personGroup)
		if (needsMigration) {
			await migrateNestedListsToGroup(person, personGroup)
		}

		// Create InviteGroup and add it as writer to PersonGroup
		let inviteGroup = Group.create()
		personGroup.addMember(inviteGroup, "writer")

		// Create invite secret for InviteGroup, build URL with personId
		let inviteSecret = inviteGroup.$jazz.createInvite("reader")
		return `${baseURL}#/person/${person.$jazz.id}/invite/${inviteGroup.$jazz.id}/${inviteSecret}`
	}

	// Migrate to group (creator becomes admin)
	let newPersonGroup = await migratePersonToGroup(person, userId)

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

	// Create InviteGroup and add it as writer to PersonGroup
	let inviteGroup = Group.create()
	newPersonGroup.addMember(inviteGroup, "writer")

	// Create invite secret for InviteGroup, build URL with personId
	let inviteSecret = inviteGroup.$jazz.createInvite("reader")
	return `${baseURL}#/person/${newPerson.$jazz.id}/invite/${inviteGroup.$jazz.id}/${inviteSecret}`
}

async function getPersonCollaborators(
	person: co.loaded<typeof Person>,
): Promise<Collaborator[]> {
	let personGroup = getPersonGroup(person)
	if (!personGroup) return []

	let collaborators: Collaborator[] = []

	for (let member of personGroup.members) {
		// Direct account members (admin = creator, or legacy direct invites)
		if (member.account && member.account.$isLoaded) {
			let profile = await member.account.$jazz.ensureLoaded({
				resolve: { profile: true },
			})
			collaborators.push({
				id: member.id,
				role: member.role,
				name: profile.profile?.name ?? "Unknown",
				inviteGroupId: undefined,
			})
		}
	}

	return collaborators
}

async function getInviteGroupsWithMembers(
	person: co.loaded<typeof Person>,
): Promise<InviteGroupWithMembers[]> {
	let personGroup = getPersonGroup(person)
	if (!personGroup) return []

	let inviteGroups: InviteGroupWithMembers[] = []

	// Find all Group members (these are InviteGroups)
	let parentGroups = personGroup.getParentGroups()
	for (let inviteGroup of parentGroups) {
		let members: Collaborator[] = []

		for (let member of inviteGroup.members) {
			// Skip admins - they're the invite creators, not collaborators
			// Collaborators join as "reader" when accepting the invite
			if (member.role === "admin") continue

			if (member.account && member.account.$isLoaded) {
				let profile = await member.account.$jazz.ensureLoaded({
					resolve: { profile: true },
				})
				members.push({
					id: member.id,
					role: member.role,
					name: profile.profile?.name ?? "Unknown",
					inviteGroupId: inviteGroup.$jazz.id,
				})
			}
		}

		if (members.length > 0) {
			inviteGroups.push({
				groupId: inviteGroup.$jazz.id,
				createdAt: new Date(inviteGroup.$jazz.createdAt),
				members,
			})
		}
	}

	return inviteGroups
}

async function removeCollaborator(
	person: co.loaded<typeof Person>,
	accountId: ID<Account>,
): Promise<void> {
	let personGroup = getPersonGroup(person)
	if (!personGroup) throw new Error("Person is not group-owned")

	// Check if this is a direct member
	let directMember = personGroup.members.find(m => m.id === accountId)
	if (directMember && directMember.account) {
		personGroup.removeMember(directMember.account)
		return
	}

	// Check InviteGroups for this account
	let parentGroups = personGroup.getParentGroups()
	for (let inviteGroup of parentGroups) {
		let member = inviteGroup.members.find(m => m.id === accountId)
		if (member && member.account) {
			// Remove the entire InviteGroup from PersonGroup
			// This revokes access for all users who joined via this invite
			personGroup.removeMember(inviteGroup)
			return
		}
	}

	throw new Error("Collaborator not found")
}

function removeInviteGroup(
	person: co.loaded<typeof Person>,
	inviteGroupId: ID<Group>,
): void {
	let personGroup = getPersonGroup(person)
	if (!personGroup) throw new Error("Person is not group-owned")

	let parentGroups = personGroup.getParentGroups()
	let inviteGroup = parentGroups.find(g => g.$jazz.id === inviteGroupId)
	if (!inviteGroup) throw new Error("Invite group not found")

	personGroup.removeMember(inviteGroup)
}

let INVITE_GROUP_EXPIRY_DAYS = 7

function cleanupEmptyInviteGroups(person: co.loaded<typeof Person>): boolean {
	let personGroup = getPersonGroup(person)
	if (!personGroup) return false

	let parentGroups = personGroup.getParentGroups()
	let didCleanup = false

	for (let inviteGroup of parentGroups) {
		// Check if invite group has any non-admin members (accounts that joined)
		let hasMembers = inviteGroup.members.some(
			m =>
				m.account &&
				m.account.$isLoaded &&
				(m.role === "writer" || m.role === "reader"),
		)

		if (hasMembers) continue

		// Check if the invite group is older than 7 days
		let createdAt = new Date(inviteGroup.$jazz.createdAt)
		let expiryDate = new Date()
		expiryDate.setDate(expiryDate.getDate() - INVITE_GROUP_EXPIRY_DAYS)

		if (createdAt < expiryDate) {
			personGroup.removeMember(inviteGroup)
			didCleanup = true
		}
	}

	return didCleanup
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
	role: "admin" | "writer" | "reader" | "writeOnly" | "manager"
	name: string
	inviteGroupId?: string
}
type InviteGroupWithMembers = {
	groupId: string
	createdAt: Date
	members: Collaborator[]
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
