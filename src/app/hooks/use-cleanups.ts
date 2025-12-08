export {
	useCleanupInactiveLists,
	useCleanupEmptyGroups,
	useCleanupInaccessiblePeople,
}

import { useEffect, useRef } from "react"
import { useAccount } from "jazz-tools/react"
import type { co, ResolveQuery } from "jazz-tools"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { cleanupEmptyInviteGroups } from "#app/features/person-sharing"

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
		inactivePeople: { $each: true },
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
		cleanupRan.current = cleanupInactiveLists(me)
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

function cleanupInactiveLists(me: LoadedUser): boolean {
	let { people, inactivePeople } = me.root
	let didCleanup = false

	// Process people list
	let peopleToRemove: number[] = []
	let peopleToMove: number[] = []
	let peopleArray = Array.from(people.values())

	for (let i = 0; i < peopleArray.length; i++) {
		let person = peopleArray[i]
		if (!person) continue

		markStaleAsPermanentlyDeleted(person)

		if (person.permanentlyDeletedAt) {
			peopleToRemove.push(i)
			continue
		}
		if (person.deletedAt) {
			peopleToMove.push(i)
		}
	}

	for (let i = peopleToMove.length - 1; i >= 0; i--) {
		let person = peopleArray[peopleToMove[i]]
		if (person && inactivePeople) inactivePeople.$jazz.push(person)
	}

	let allPeopleToRemove = [
		...new Set([...peopleToRemove, ...peopleToMove]),
	].sort((a, b) => a - b)
	for (let i = allPeopleToRemove.length - 1; i >= 0; i--) {
		people.$jazz.splice(allPeopleToRemove[i], 1)
	}

	didCleanup = peopleToRemove.length > 0 || peopleToMove.length > 0

	// Cleanup stale from inactive people
	if (inactivePeople) {
		let inactivePeopleToRemove: number[] = []
		let inactivePeopleArray = Array.from(inactivePeople.values())

		for (let i = 0; i < inactivePeopleArray.length; i++) {
			let person = inactivePeopleArray[i]
			if (!person) continue

			markStaleAsPermanentlyDeleted(person)

			if (person.permanentlyDeletedAt) {
				inactivePeopleToRemove.push(i)
			}
		}

		for (let i = inactivePeopleToRemove.length - 1; i >= 0; i--) {
			inactivePeople.$jazz.splice(inactivePeopleToRemove[i], 1)
		}

		didCleanup = didCleanup || inactivePeopleToRemove.length > 0
	}

	// Process each person's notes and reminders
	for (let person of people.values()) {
		if (!person) continue

		// Process notes
		if (person.notes && person.inactiveNotes) {
			let notesToRemove: number[] = []
			let notesToMove: number[] = []
			let notesArray = Array.from(person.notes.values())

			for (let i = 0; i < notesArray.length; i++) {
				let note = notesArray[i]
				if (!note) continue

				markStaleAsPermanentlyDeleted(note)

				if (note.permanentlyDeletedAt) {
					notesToRemove.push(i)
					continue
				}
				if (note.deletedAt) {
					notesToMove.push(i)
				}
			}

			for (let i = notesToMove.length - 1; i >= 0; i--) {
				let note = notesArray[notesToMove[i]]
				if (note) person.inactiveNotes.$jazz.push(note)
			}

			let allNotesToRemove = [
				...new Set([...notesToRemove, ...notesToMove]),
			].sort((a, b) => a - b)
			for (let i = allNotesToRemove.length - 1; i >= 0; i--) {
				person.notes.$jazz.splice(allNotesToRemove[i], 1)
			}

			didCleanup =
				didCleanup || notesToRemove.length > 0 || notesToMove.length > 0
		}

		// Cleanup stale from inactive notes
		if (person.inactiveNotes) {
			let inactiveNotesToRemove: number[] = []
			let inactiveNotesArray = Array.from(person.inactiveNotes.values())

			for (let i = 0; i < inactiveNotesArray.length; i++) {
				let note = inactiveNotesArray[i]
				if (!note) continue

				markStaleAsPermanentlyDeleted(note)

				if (note.permanentlyDeletedAt) {
					inactiveNotesToRemove.push(i)
				}
			}

			for (let i = inactiveNotesToRemove.length - 1; i >= 0; i--) {
				person.inactiveNotes.$jazz.splice(inactiveNotesToRemove[i], 1)
			}

			didCleanup = didCleanup || inactiveNotesToRemove.length > 0
		}

		// Process reminders
		if (person.reminders && person.inactiveReminders) {
			let remindersToRemove: number[] = []
			let remindersToMove: number[] = []
			let remindersArray = Array.from(person.reminders.values())

			for (let i = 0; i < remindersArray.length; i++) {
				let reminder = remindersArray[i]
				if (!reminder) continue

				markStaleAsPermanentlyDeleted(reminder)

				if (reminder.permanentlyDeletedAt) {
					remindersToRemove.push(i)
					continue
				}
				if (reminder.deletedAt || reminder.done) {
					remindersToMove.push(i)
				}
			}

			for (let i = remindersToMove.length - 1; i >= 0; i--) {
				let reminder = remindersArray[remindersToMove[i]]
				if (reminder) person.inactiveReminders.$jazz.push(reminder)
			}

			let allRemindersToRemove = [
				...new Set([...remindersToRemove, ...remindersToMove]),
			].sort((a, b) => a - b)
			for (let i = allRemindersToRemove.length - 1; i >= 0; i--) {
				person.reminders.$jazz.splice(allRemindersToRemove[i], 1)
			}

			didCleanup =
				didCleanup || remindersToRemove.length > 0 || remindersToMove.length > 0
		}

		// Cleanup stale from inactive reminders
		if (person.inactiveReminders) {
			let inactiveRemindersToRemove: number[] = []
			let inactiveRemindersArray = Array.from(person.inactiveReminders.values())

			for (let i = 0; i < inactiveRemindersArray.length; i++) {
				let reminder = inactiveRemindersArray[i]
				if (!reminder) continue

				markStaleAsPermanentlyDeleted(reminder)

				if (reminder.permanentlyDeletedAt) {
					inactiveRemindersToRemove.push(i)
				}
			}

			for (let i = inactiveRemindersToRemove.length - 1; i >= 0; i--) {
				person.inactiveReminders.$jazz.splice(inactiveRemindersToRemove[i], 1)
			}

			didCleanup = didCleanup || inactiveRemindersToRemove.length > 0
		}
	}

	return didCleanup
}

function markStaleAsPermanentlyDeleted(item: {
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	$jazz: { set(key: string, value: unknown): void }
}): void {
	if (item.deletedAt && !item.permanentlyDeletedAt && isStale(item.deletedAt)) {
		item.$jazz.set("permanentlyDeletedAt", item.deletedAt)
	}
}

function isStale(deletedAt: Date): boolean {
	let thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
	return deletedAt < thirtyDaysAgo
}
