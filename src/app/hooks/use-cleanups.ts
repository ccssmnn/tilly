export {
	useCleanupInactiveLists,
	useCleanupEmptyGroups,
	useCleanupInaccessiblePeople,
}

import { useEffect, useRef } from "react"
import { useAccount } from "jazz-tools/react"
import { Group, type co, type ResolveQuery } from "jazz-tools"
import { UserAccount, Person, isDeleted } from "#shared/schema/user"
import {
	permanentlyDeleteNote,
	permanentlyDeletePerson,
	permanentlyDeleteReminder,
} from "#shared/lib/delete-covalue"

let inactiveListsQuery = {
	root: {
		people: {
			$each: {
				notes: { $each: true },
				inactiveNotes: { $each: true },
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		},
		inactivePeople: {
			$each: {
				notes: { $each: true },
				reminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let emptyGroupsQuery = {
	root: {
		people: { $each: true },
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let inaccessiblePeopleQuery = {
	root: {
		people: {
			$each: {
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedUser = co.loaded<typeof UserAccount, typeof inactiveListsQuery>

function useCleanupInactiveLists(): void {
	let cleanupRan = useRef(false)
	let me = useAccount(UserAccount, { resolve: inactiveListsQuery })

	useEffect(() => {
		if (cleanupRan.current || !me.$isLoaded) return
		cleanupRan.current = true
		cleanupInactiveLists(me)
	}, [me.$isLoaded, me])
}

function useCleanupEmptyGroups(): void {
	let cleanupRan = useRef(false)
	let me = useAccount(UserAccount, { resolve: emptyGroupsQuery })

	useEffect(() => {
		if (cleanupRan.current || !me.$isLoaded) return
		cleanupRan.current = true
		for (let person of me.root.people.values()) {
			if (person && !isDeleted(person)) {
				cleanupEmptyInviteGroups(person)
			}
		}
	}, [me.$isLoaded, me])
}

function useCleanupInaccessiblePeople(): void {
	let cleanupRan = useRef(false)
	let me = useAccount(UserAccount, { resolve: inaccessiblePeopleQuery })

	useEffect(() => {
		if (cleanupRan.current || !me.$isLoaded) return
		cleanupRan.current = true

		let indicesToRemove: number[] = []
		let peopleArray = Array.from(me.root.people.values())

		for (let i = 0; i < peopleArray.length; i++) {
			let person = peopleArray[i]
			if (!person?.$isLoaded) {
				indicesToRemove.push(i)
			}
		}

		for (let i = indicesToRemove.length - 1; i >= 0; i--) {
			me.root.people.$jazz.splice(indicesToRemove[i], 1)
		}
	}, [me.$isLoaded, me])
}

async function cleanupInactiveLists(me: LoadedUser): Promise<void> {
	let { people, inactivePeople } = me.root

	// Process people list - move deleted to inactive
	let peopleToMove: number[] = []
	let peopleArray = Array.from(people.values())

	for (let i = 0; i < peopleArray.length; i++) {
		let person = peopleArray[i]
		if (!person) continue
		if (person.deletedAt) {
			peopleToMove.push(i)
		}
	}

	for (let i = peopleToMove.length - 1; i >= 0; i--) {
		let person = peopleArray[peopleToMove[i]]
		if (person && inactivePeople) inactivePeople.$jazz.push(person)
		people.$jazz.splice(peopleToMove[i], 1)
	}

	// Delete stale inactive people
	if (inactivePeople) {
		let inactivePeopleToDelete: number[] = []
		let inactivePeopleArray = Array.from(inactivePeople.values())

		for (let i = 0; i < inactivePeopleArray.length; i++) {
			let person = inactivePeopleArray[i]
			if (!person) continue
			if (person.deletedAt && isStale(person.deletedAt)) {
				inactivePeopleToDelete.push(i)
			}
		}

		// Remove from list first, then delete
		for (let i = inactivePeopleToDelete.length - 1; i >= 0; i--) {
			let person = inactivePeopleArray[inactivePeopleToDelete[i]]
			inactivePeople.$jazz.splice(inactivePeopleToDelete[i], 1)
			if (person) {
				try {
					await permanentlyDeletePerson(person)
				} catch {
					// May fail if not accessible, skip
				}
			}
		}
	}

	// Process each person's notes and reminders
	for (let person of people.values()) {
		if (!person) continue

		// Process notes - move deleted to inactive
		if (person.notes && person.inactiveNotes) {
			let notesToMove: number[] = []
			let notesArray = Array.from(person.notes.values())

			for (let i = 0; i < notesArray.length; i++) {
				let note = notesArray[i]
				if (!note) continue
				if (note.deletedAt) {
					notesToMove.push(i)
				}
			}

			for (let i = notesToMove.length - 1; i >= 0; i--) {
				let note = notesArray[notesToMove[i]]
				if (note) person.inactiveNotes.$jazz.push(note)
				person.notes.$jazz.splice(notesToMove[i], 1)
			}
		}

		// Delete stale inactive notes
		if (person.inactiveNotes) {
			let inactiveNotesToDelete: number[] = []
			let inactiveNotesArray = Array.from(person.inactiveNotes.values())

			for (let i = 0; i < inactiveNotesArray.length; i++) {
				let note = inactiveNotesArray[i]
				if (!note) continue
				if (note.deletedAt && isStale(note.deletedAt)) {
					inactiveNotesToDelete.push(i)
				}
			}

			for (let i = inactiveNotesToDelete.length - 1; i >= 0; i--) {
				let note = inactiveNotesArray[inactiveNotesToDelete[i]]
				person.inactiveNotes.$jazz.splice(inactiveNotesToDelete[i], 1)
				if (note) {
					try {
						await permanentlyDeleteNote(note)
					} catch {
						// May fail if not accessible, skip
					}
				}
			}
		}

		// Process reminders - move deleted/done to inactive
		if (person.reminders && person.inactiveReminders) {
			let remindersToMove: number[] = []
			let remindersArray = Array.from(person.reminders.values())

			for (let i = 0; i < remindersArray.length; i++) {
				let reminder = remindersArray[i]
				if (!reminder) continue
				if (reminder.deletedAt || reminder.done) {
					remindersToMove.push(i)
				}
			}

			for (let i = remindersToMove.length - 1; i >= 0; i--) {
				let reminder = remindersArray[remindersToMove[i]]
				if (reminder) person.inactiveReminders.$jazz.push(reminder)
				person.reminders.$jazz.splice(remindersToMove[i], 1)
			}
		}

		// Delete stale inactive reminders
		if (person.inactiveReminders) {
			let inactiveRemindersToDelete: number[] = []
			let inactiveRemindersArray = Array.from(person.inactiveReminders.values())

			for (let i = 0; i < inactiveRemindersArray.length; i++) {
				let reminder = inactiveRemindersArray[i]
				if (!reminder) continue
				if (reminder.deletedAt && isStale(reminder.deletedAt)) {
					inactiveRemindersToDelete.push(i)
				}
			}

			for (let i = inactiveRemindersToDelete.length - 1; i >= 0; i--) {
				let reminder = inactiveRemindersArray[inactiveRemindersToDelete[i]]
				person.inactiveReminders.$jazz.splice(inactiveRemindersToDelete[i], 1)
				if (reminder) {
					try {
						await permanentlyDeleteReminder(reminder)
					} catch {
						// May fail if not accessible, skip
					}
				}
			}
		}
	}
}

function isStale(deletedAt: Date): boolean {
	let thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
	return deletedAt < thirtyDaysAgo
}

let INVITE_GROUP_EXPIRY_DAYS = 7

function cleanupEmptyInviteGroups(person: co.loaded<typeof Person>): boolean {
	let personGroup = getPersonGroup(person)
	if (!personGroup) return false

	let parentGroups = personGroup.getParentGroups()
	let didCleanup = false

	for (let inviteGroup of parentGroups) {
		let hasMembers = inviteGroup.members.some(
			m =>
				m.account &&
				m.account.$isLoaded &&
				(m.role === "writer" || m.role === "reader"),
		)

		if (hasMembers) continue

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

function getPersonGroup(person: co.loaded<typeof Person>): Group | null {
	let group = person.$jazz.owner
	if (!group || !(group instanceof Group)) return null
	return group
}
