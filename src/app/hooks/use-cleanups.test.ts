import { beforeEach, describe, expect, test } from "vitest"
import { co } from "jazz-tools"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"
import { createAccount, seedPerson, seedNote, seedReminder } from "#shared/tools/test-helpers"
import { cleanupInactiveLists, isStale } from "./use-cleanups"

function daysAgo(n: number): Date {
	let d = new Date()
	d.setDate(d.getDate() - n)
	return d
}

async function loadForCleanup(account: co.loaded<typeof UserAccount>) {
	return await account.$jazz.ensureLoaded({
		resolve: {
			root: {
				people: {
					$each: {
						notes: { $each: { $onError: "catch" } },
						inactiveNotes: { $each: { $onError: "catch" } },
						reminders: { $each: { $onError: "catch" } },
						inactiveReminders: { $each: { $onError: "catch" } },
						$onError: "catch",
					},
				},
				inactivePeople: {
					$each: {
						notes: { $each: { $onError: "catch" } },
						reminders: { $each: { $onError: "catch" } },
						$onError: "catch",
					},
				},
			},
		},
	})
}

async function ensureInactiveLists(person: co.loaded<typeof Person>) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: { inactiveNotes: true, inactiveReminders: true },
	})
	if (!loaded.inactiveNotes) {
		person.$jazz.set(
			"inactiveNotes",
			co.list(Note).create([], person.$jazz.owner),
		)
	}
	if (!loaded.inactiveReminders) {
		person.$jazz.set(
			"inactiveReminders",
			co.list(Reminder).create([], person.$jazz.owner),
		)
	}
}

describe("isStale", () => {
	test("returns true for dates older than 30 days", () => {
		expect(isStale(daysAgo(31))).toBe(true)
		expect(isStale(daysAgo(60))).toBe(true)
	})

	test("returns false for dates within 30 days", () => {
		expect(isStale(daysAgo(29))).toBe(false)
		expect(isStale(daysAgo(0))).toBe(false)
		expect(isStale(new Date())).toBe(false)
	})
})

describe("cleanupInactiveLists", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("moves soft-deleted person from active to inactivePeople", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		person.$jazz.set("deletedAt", daysAgo(1))

		let loaded = await loadForCleanup(owner)
		await cleanupInactiveLists(loaded)

		let after = await owner.$jazz.ensureLoaded({
			resolve: {
				root: {
					people: { $each: true },
					inactivePeople: { $each: true },
				},
			},
		})
		expect(after.root.people.some(p => p?.$jazz.id === person.$jazz.id)).toBe(
			false,
		)
		expect(
			after.root.inactivePeople?.some(p => p?.$jazz.id === person.$jazz.id),
		).toBe(true)
	})

	test("leaves active people untouched", async () => {
		let person = await seedPerson(owner, { name: "Active" })

		let loaded = await loadForCleanup(owner)
		await cleanupInactiveLists(loaded)

		let after = await owner.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: true } } },
		})
		expect(after.root.people.some(p => p?.$jazz.id === person.$jazz.id)).toBe(
			true,
		)
	})

	test("moves deleted note from notes to inactiveNotes", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await ensureInactiveLists(person)
		let note = await seedNote(person, {
			content: "to delete",
			deletedAt: daysAgo(1),
		})

		let loaded = await loadForCleanup(owner)
		await cleanupInactiveLists(loaded)

		let after = await person.$jazz.ensureLoaded({
			resolve: {
				notes: { $each: true },
				inactiveNotes: { $each: true },
			},
		})
		expect(after.notes.some(n => n?.$jazz.id === note.$jazz.id)).toBe(false)
		expect(after.inactiveNotes?.some(n => n?.$jazz.id === note.$jazz.id)).toBe(
			true,
		)
	})

	test("moves deleted reminder from reminders to inactiveReminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await ensureInactiveLists(person)
		let reminder = await seedReminder(person, {
			text: "old task",
			dueAtDate: "2025-01-01",
			deletedAt: daysAgo(1),
		})

		let loaded = await loadForCleanup(owner)
		await cleanupInactiveLists(loaded)

		let after = await person.$jazz.ensureLoaded({
			resolve: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		expect(
			after.reminders.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(false)
		expect(
			after.inactiveReminders?.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(true)
	})

	test("moves done reminder to inactiveReminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await ensureInactiveLists(person)
		let reminder = await seedReminder(person, {
			text: "done task",
			dueAtDate: "2025-01-01",
			done: true,
		})

		let loaded = await loadForCleanup(owner)
		await cleanupInactiveLists(loaded)

		let after = await person.$jazz.ensureLoaded({
			resolve: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		expect(
			after.reminders.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(false)
		expect(
			after.inactiveReminders?.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(true)
	})

	test("keeps active notes and reminders in their lists", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await ensureInactiveLists(person)
		let note = await seedNote(person, { content: "active note" })
		let reminder = await seedReminder(person, {
			text: "active task",
			dueAtDate: "2025-12-01",
		})

		let loaded = await loadForCleanup(owner)
		await cleanupInactiveLists(loaded)

		let after = await person.$jazz.ensureLoaded({
			resolve: {
				notes: { $each: true },
				reminders: { $each: true },
			},
		})
		expect(after.notes.some(n => n?.$jazz.id === note.$jazz.id)).toBe(true)
		expect(
			after.reminders.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(true)
	})
})
