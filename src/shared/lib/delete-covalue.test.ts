import { beforeEach, describe, expect, test } from "vitest"
import { createJazzTestAccount } from "jazz-tools/testing"
import { co, Group } from "jazz-tools"
import { Person, Note, Reminder, UserAccount } from "#shared/schema/user"
import {
	permanentlyDeleteNote,
	permanentlyDeleteReminder,
	permanentlyDeletePerson,
} from "#shared/lib/delete-covalue"

describe("permanentlyDeleteNote", () => {
	let account: co.loaded<typeof UserAccount>
	let person: co.loaded<typeof Person>

	beforeEach(async () => {
		account = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: UserAccount,
		})

		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})

		let group = Group.create()
		person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: co.list(Note).create([], group),
				reminders: co.list(Reminder).create([], group),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		root.people.$jazz.push(person)
	})

	test("deletes a note from person's notes list", async () => {
		let loadedPerson = await person.$jazz.ensureLoaded({
			resolve: { notes: true },
		})
		let group = loadedPerson.$jazz.owner
		let note = Note.create(
			{
				version: 1,
				content: "Test note",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		loadedPerson.notes.$jazz.push(note)

		expect(loadedPerson.notes.length).toBe(1)

		await permanentlyDeleteNote(note)

		// After deletion, the note should have loadingState "deleted"
		let loadedNote = await Note.load(note.$jazz.id)
		expect(loadedNote?.$jazz.loadingState).toBe("deleted")
		expect(loadedNote?.$isLoaded).toBe(false)
	})

	test("note ID becomes inaccessible after deletion", async () => {
		let loadedPerson = await person.$jazz.ensureLoaded({
			resolve: { notes: true },
		})
		let group = loadedPerson.$jazz.owner
		let note = Note.create(
			{
				version: 1,
				content: "Test note",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		let noteId = note.$jazz.id
		loadedPerson.notes.$jazz.push(note)

		await permanentlyDeleteNote(note)

		// Attempting to load the deleted note should return deleted state
		let loadedNote = await Note.load(noteId)
		expect(loadedNote?.$jazz.loadingState).toBe("deleted")
	})
})

describe("permanentlyDeleteReminder", () => {
	let account: co.loaded<typeof UserAccount>
	let person: co.loaded<typeof Person>

	beforeEach(async () => {
		account = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: UserAccount,
		})

		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})

		let group = Group.create()
		person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: co.list(Note).create([], group),
				reminders: co.list(Reminder).create([], group),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		root.people.$jazz.push(person)
	})

	test("deletes a reminder", async () => {
		let loadedPerson = await person.$jazz.ensureLoaded({
			resolve: { reminders: true },
		})
		let group = loadedPerson.$jazz.owner
		let reminder = Reminder.create(
			{
				version: 1,
				text: "Test reminder",
				dueAtDate: new Date().toISOString(),
				done: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		loadedPerson.reminders.$jazz.push(reminder)

		expect(loadedPerson.reminders.length).toBe(1)

		await permanentlyDeleteReminder(reminder)

		// After deletion, the reminder should have loadingState "deleted"
		let loadedReminder = await Reminder.load(reminder.$jazz.id)
		expect(loadedReminder?.$jazz.loadingState).toBe("deleted")
	})
})

describe("permanentlyDeletePerson", () => {
	let account: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		account = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: UserAccount,
		})
	})

	test("deletes a person and their notes", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})

		let group = Group.create()
		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: co.list(Note).create([], group),
				reminders: co.list(Reminder).create([], group),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)

		// Add a note
		let note = Note.create(
			{
				version: 1,
				content: "Test note",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		person.notes.$jazz.push(note)
		root.people.$jazz.push(person)

		let personId = person.$jazz.id
		let noteId = note.$jazz.id

		await permanentlyDeletePerson(person)

		// Person should have loadingState "deleted"
		let loadedPerson = await Person.load(personId)
		expect(loadedPerson?.$jazz.loadingState).toBe("deleted")

		// Note should also be deleted
		let loadedNote = await Note.load(noteId)
		expect(loadedNote?.$jazz.loadingState).toBe("deleted")
	})

	test("deletes a person and their reminders", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})

		let group = Group.create()
		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: co.list(Note).create([], group),
				reminders: co.list(Reminder).create([], group),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)

		// Add a reminder
		let reminder = Reminder.create(
			{
				version: 1,
				text: "Test reminder",
				dueAtDate: new Date().toISOString(),
				done: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		person.reminders.$jazz.push(reminder)
		root.people.$jazz.push(person)

		let personId = person.$jazz.id
		let reminderId = reminder.$jazz.id

		await permanentlyDeletePerson(person)

		// Person should have loadingState "deleted"
		let loadedPerson = await Person.load(personId)
		expect(loadedPerson?.$jazz.loadingState).toBe("deleted")

		// Reminder should also be deleted
		let loadedReminder = await Reminder.load(reminderId)
		expect(loadedReminder?.$jazz.loadingState).toBe("deleted")
	})
})

describe("deleted items in lists", () => {
	let account: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		account = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: UserAccount,
		})
	})

	test("deleted person has loadingState deleted when accessed directly", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})

		let group = Group.create()
		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: co.list(Note).create([], group),
				reminders: co.list(Reminder).create([], group),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		root.people.$jazz.push(person)
		let personId = person.$jazz.id

		expect(root.people.length).toBe(1)
		expect(root.people[0]).not.toBeNull()

		await permanentlyDeletePerson(person)

		// Load the person directly - should show deleted state
		let loadedPerson = await Person.load(personId)
		expect(loadedPerson?.$jazz.loadingState).toBe("deleted")
		expect(loadedPerson?.$isLoaded).toBe(false)
	})

	test("deleted note has loadingState deleted when accessed directly", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})

		let group = Group.create()
		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: co.list(Note).create([], group),
				reminders: co.list(Reminder).create([], group),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)

		let note1 = Note.create(
			{
				version: 1,
				content: "Note 1",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)
		let note2 = Note.create(
			{
				version: 1,
				content: "Note 2",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			group,
		)

		let loadedPerson = await person.$jazz.ensureLoaded({
			resolve: { notes: true },
		})
		loadedPerson.notes.$jazz.push(note1)
		loadedPerson.notes.$jazz.push(note2)
		root.people.$jazz.push(person)

		let note1Id = note1.$jazz.id
		let note2Id = note2.$jazz.id

		// Delete only note1
		await permanentlyDeleteNote(note1)

		// Load notes directly - note1 should be deleted, note2 should be accessible
		let loadedNote1 = await Note.load(note1Id)
		let loadedNote2 = await Note.load(note2Id)

		expect(loadedNote1?.$jazz.loadingState).toBe("deleted")
		expect(loadedNote2?.$isLoaded).toBe(true)
		if (loadedNote2?.$isLoaded) {
			expect(loadedNote2.content).toBe("Note 2")
		}
	})
})
