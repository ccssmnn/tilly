import { beforeEach, describe, expect, test } from "vitest"
import { createJazzTestAccount, setupJazzTestSync } from "jazz-tools/testing"
import { co } from "jazz-tools"
import { UserAccount, Person, Reminder } from "#shared/schema/user"

// Extract the reminder collection logic for testing
function extractRemindersForSync(
	people: Iterable<co.loaded<
		typeof Person,
		{ reminders: { $each: true } }
	> | null>,
	isDeleted: (item: { deletedAt?: Date }) => boolean,
): { id: string; dueAtDate: string }[] {
	let reminders: { id: string; dueAtDate: string }[] = []

	for (let person of people) {
		if (!person?.reminders || isDeleted(person)) continue
		for (let reminder of person.reminders.values()) {
			if (!reminder || reminder.done || isDeleted(reminder)) continue
			reminders.push({ id: reminder.$jazz.id, dueAtDate: reminder.dueAtDate })
		}
	}

	return reminders
}

describe("extractRemindersForSync", () => {
	let account: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		await setupJazzTestSync()

		account = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: UserAccount,
		})
	})

	test("extracts active reminders from people", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: [],
				reminders: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			root.people.$jazz.owner,
		)
		root.people.$jazz.push(person)

		let reminder = Reminder.create(
			{
				version: 1,
				text: "Call them",
				dueAtDate: "2025-01-15",
				done: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			person.reminders.$jazz.owner,
		)
		person.reminders.$jazz.push(reminder)

		let { root: loadedRoot } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let result = extractRemindersForSync(
			loadedRoot.people.values(),
			item => !!item.deletedAt,
		)

		expect(result.length).toBe(1)
		expect(result[0].dueAtDate).toBe("2025-01-15")
	})

	test("excludes done reminders", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: [],
				reminders: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			root.people.$jazz.owner,
		)
		root.people.$jazz.push(person)

		let doneReminder = Reminder.create(
			{
				version: 1,
				text: "Already done",
				dueAtDate: "2025-01-15",
				done: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			person.reminders.$jazz.owner,
		)
		person.reminders.$jazz.push(doneReminder)

		let { root: loadedRoot } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let result = extractRemindersForSync(
			loadedRoot.people.values(),
			item => !!item.deletedAt,
		)

		expect(result.length).toBe(0)
	})

	test("excludes deleted reminders", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes: [],
				reminders: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			root.people.$jazz.owner,
		)
		root.people.$jazz.push(person)

		let deletedReminder = Reminder.create(
			{
				version: 1,
				text: "Deleted",
				dueAtDate: "2025-01-15",
				done: false,
				deletedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			person.reminders.$jazz.owner,
		)
		person.reminders.$jazz.push(deletedReminder)

		let { root: loadedRoot } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let result = extractRemindersForSync(
			loadedRoot.people.values(),
			item => !!item.deletedAt,
		)

		expect(result.length).toBe(0)
	})

	test("excludes reminders from deleted people", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let deletedPerson = Person.create(
			{
				version: 1,
				name: "Deleted Person",
				notes: [],
				reminders: [],
				deletedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			root.people.$jazz.owner,
		)
		root.people.$jazz.push(deletedPerson)

		let reminder = Reminder.create(
			{
				version: 1,
				text: "Should be excluded",
				dueAtDate: "2025-01-15",
				done: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			deletedPerson.reminders.$jazz.owner,
		)
		deletedPerson.reminders.$jazz.push(reminder)

		let { root: loadedRoot } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let result = extractRemindersForSync(
			loadedRoot.people.values(),
			item => !!item.deletedAt,
		)

		expect(result.length).toBe(0)
	})

	test("extracts reminders from multiple people", async () => {
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let person1 = Person.create(
			{
				version: 1,
				name: "Person 1",
				notes: [],
				reminders: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			root.people.$jazz.owner,
		)
		root.people.$jazz.push(person1)

		let person2 = Person.create(
			{
				version: 1,
				name: "Person 2",
				notes: [],
				reminders: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			root.people.$jazz.owner,
		)
		root.people.$jazz.push(person2)

		let reminder1 = Reminder.create(
			{
				version: 1,
				text: "Reminder 1",
				dueAtDate: "2025-01-15",
				done: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			person1.reminders.$jazz.owner,
		)
		person1.reminders.$jazz.push(reminder1)

		let reminder2 = Reminder.create(
			{
				version: 1,
				text: "Reminder 2",
				dueAtDate: "2025-01-20",
				done: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			person2.reminders.$jazz.owner,
		)
		person2.reminders.$jazz.push(reminder2)

		let { root: loadedRoot } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})

		let result = extractRemindersForSync(
			loadedRoot.people.values(),
			item => !!item.deletedAt,
		)

		expect(result.length).toBe(2)
		expect(result.map(r => r.dueAtDate).sort()).toEqual([
			"2025-01-15",
			"2025-01-20",
		])
	})
})
