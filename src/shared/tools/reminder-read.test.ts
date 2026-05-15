import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { listReminders } from "#shared/tools/reminder-read"
import { updateReminder } from "#shared/tools/reminder-update"
import {
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

describe("listReminders", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns reminders across people, hides done and deleted by default", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedReminder(ada, { text: "ada-1", dueAtDate: "2099-01-01" })
		await seedReminder(grace, { text: "grace-1", dueAtDate: "2099-01-01" })
		let done = await seedReminder(ada, {
			text: "done-one",
			dueAtDate: "2099-01-01",
		})
		await updateReminder(owner, {
			personId: ada.$jazz.id,
			reminderId: done.$jazz.id,
			done: true,
		})

		let result = await listReminders(owner, {
			includeDone: false,
			includeDeleted: false,
		})
		expect(result.reminders.map(r => r.text).sort()).toEqual([
			"ada-1",
			"grace-1",
		])
	})

	test("dueOnly filters out reminders due in the future", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedReminder(ada, { text: "past", dueAtDate: "2000-01-01" })
		await seedReminder(ada, { text: "future", dueAtDate: "2099-01-01" })

		let result = await listReminders(owner, {
			dueOnly: true,
			includeDone: false,
			includeDeleted: false,
		})
		expect(result.reminders.map(r => r.text)).toEqual(["past"])
	})

	test("sorted by due date ascending", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedReminder(ada, { text: "later", dueAtDate: "2099-12-31" })
		await seedReminder(ada, { text: "earlier", dueAtDate: "2099-01-01" })
		await seedReminder(ada, { text: "middle", dueAtDate: "2099-06-15" })

		let result = await listReminders(owner, {
			includeDone: false,
			includeDeleted: false,
		})
		expect(result.reminders.map(r => r.text)).toEqual([
			"earlier",
			"middle",
			"later",
		])
	})

	test("search filters by reminder text and person name", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedReminder(ada, {
			text: "needle ping",
			dueAtDate: "2099-01-01",
		})
		await seedReminder(ada, { text: "boring", dueAtDate: "2099-01-01" })
		await seedReminder(grace, { text: "plain", dueAtDate: "2099-01-01" })

		let byText = await listReminders(owner, {
			searchQuery: "needle",
			includeDone: false,
			includeDeleted: false,
		})
		expect(byText.reminders.map(r => r.text)).toEqual(["needle ping"])

		let byPerson = await listReminders(owner, {
			searchQuery: "grace",
			includeDone: false,
			includeDeleted: false,
		})
		expect(byPerson.reminders.every(r => r.person.name === "Grace")).toBe(true)
	})

	test("includeDone returns completed reminders", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let r = await seedReminder(ada, { text: "x", dueAtDate: "2099-01-01" })
		await updateReminder(owner, {
			personId: ada.$jazz.id,
			reminderId: r.$jazz.id,
			done: true,
		})

		let result = await listReminders(owner, {
			includeDone: true,
			includeDeleted: false,
		})
		expect(result.reminders.some(rem => rem.done)).toBe(true)
	})
})
