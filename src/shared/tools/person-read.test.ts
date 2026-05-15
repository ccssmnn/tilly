import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { getPersonDetails, listPeople } from "#shared/tools/person-read"
import { updatePerson } from "#shared/tools/person-update"
import {
	createAccount,
	seedNote,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

describe("listPeople", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns active people, hides deleted by default", async () => {
		await seedPerson(owner, { name: "Active" })
		let deleted = await seedPerson(owner, { name: "Deleted" })
		await updatePerson(owner, {
			personId: deleted.$jazz.id,
			deletedAt: new Date(),
		})

		let result = await listPeople(owner, { includeDeleted: false })
		expect(result.count).toBe(1)
		expect(result.people[0]?.name).toBe("Active")
	})

	test("includeDeleted returns both", async () => {
		await seedPerson(owner, { name: "Active" })
		let deleted = await seedPerson(owner, { name: "Deleted" })
		await updatePerson(owner, {
			personId: deleted.$jazz.id,
			deletedAt: new Date(),
		})

		let result = await listPeople(owner, { includeDeleted: true })
		expect(result.count).toBe(2)
	})

	test("search filters by name and summary", async () => {
		await seedPerson(owner, { name: "Ada Lovelace" })
		await seedPerson(owner, { name: "Grace Hopper", summary: "compilers" })
		await seedPerson(owner, { name: "Random", summary: "ada is here too" })

		let byName = await listPeople(owner, {
			search: "grace",
			includeDeleted: false,
		})
		expect(byName.people.map(p => p.name)).toContain("Grace Hopper")

		let bySummary = await listPeople(owner, {
			search: "compilers",
			includeDeleted: false,
		})
		expect(bySummary.people.map(p => p.name)).toContain("Grace Hopper")
	})
})

describe("getPersonDetails", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns the person with notes and reminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await seedNote(person, { content: "note one" })
		await seedNote(person, { content: "note two" })
		await seedReminder(person, { text: "ping", dueAtDate: "2099-01-01" })

		let result = await getPersonDetails(owner, {
			personId: person.$jazz.id,
			includeDeletedNotes: false,
			includeDeletedReminders: false,
		})

		expect(result.name).toBe("Ada")
		expect(result.notes).toHaveLength(2)
		expect(result.reminders).toHaveLength(1)
	})

	test("hides soft-deleted notes by default", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await seedNote(person, { content: "kept" })
		await seedNote(person, { content: "gone", deletedAt: new Date() })

		let result = await getPersonDetails(owner, {
			personId: person.$jazz.id,
			includeDeletedNotes: false,
			includeDeletedReminders: false,
		})
		expect(result.notes.map(n => n.content)).toEqual(["kept"])
	})

	test("search filters notes and reminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await seedNote(person, { content: "needle in haystack" })
		await seedNote(person, { content: "unrelated" })
		await seedReminder(person, {
			text: "needle ping",
			dueAtDate: "2099-01-01",
		})
		await seedReminder(person, { text: "other ping", dueAtDate: "2099-01-01" })

		let result = await getPersonDetails(owner, {
			personId: person.$jazz.id,
			search: "needle",
			includeDeletedNotes: false,
			includeDeletedReminders: false,
		})
		expect(result.notes.map(n => n.content)).toEqual(["needle in haystack"])
		expect(result.reminders.map(r => r.text)).toEqual(["needle ping"])
	})

	test("throws when person not found", async () => {
		await expect(
			getPersonDetails(owner, {
				personId: "co_zNope",
				includeDeletedNotes: false,
				includeDeletedReminders: false,
			}),
		).rejects.toBeDefined()
	})
})
