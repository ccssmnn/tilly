import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { Reminder, UserAccount } from "#shared/schema/user"
import { updateReminder } from "#shared/tools/reminder-update"
import {
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

describe("updateReminder", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("edits text and dueAtDate, returns previous + current", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "old",
			dueAtDate: "2099-01-01",
		})

		let result = await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			text: "new",
			dueAtDate: "2099-02-01",
		})

		expect(result.previous.text).toBe("old")
		expect(result.previous.dueAtDate).toBe("2099-01-01")
		expect(result.current.text).toBe("new")
		expect(result.current.dueAtDate).toBe("2099-02-01")
	})

	test("mark done (non-repeating) moves to inactiveReminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "do it",
			dueAtDate: "2099-01-01",
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})

		let loaded = await person.$jazz.ensureLoaded({
			resolve: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		expect(loaded.reminders.some(r => r?.$jazz.id === reminder.$jazz.id)).toBe(
			false,
		)
		expect(
			loaded.inactiveReminders?.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(true)
	})

	test("mark done (repeating) reschedules to next occurrence and stays active", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "weekly call",
			dueAtDate: "2099-01-01",
			repeat: { interval: 1, unit: "week" },
		})

		let result = await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})

		expect(result.current.done).toBe(false)
		expect(result.current.dueAtDate).toBe("2099-01-08")

		let loaded = await person.$jazz.ensureLoaded({
			resolve: { reminders: { $each: true } },
		})
		expect(loaded.reminders.some(r => r?.$jazz.id === reminder.$jazz.id)).toBe(
			true,
		)
	})

	test("undone restores from inactive to active", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "x",
			dueAtDate: "2099-01-01",
		})
		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: false,
		})

		let loaded = await person.$jazz.ensureLoaded({
			resolve: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		expect(loaded.reminders.some(r => r?.$jazz.id === reminder.$jazz.id)).toBe(
			true,
		)
	})

	test("soft delete moves to inactive, restore moves back", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "x",
			dueAtDate: "2099-01-01",
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			deletedAt: new Date(),
		})

		let afterDelete = await person.$jazz.ensureLoaded({
			resolve: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		expect(
			afterDelete.inactiveReminders?.some(
				r => r?.$jazz.id === reminder.$jazz.id,
			),
		).toBe(true)

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			deletedAt: undefined,
		})

		let afterRestore = await person.$jazz.ensureLoaded({
			resolve: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		expect(
			afterRestore.reminders.some(r => r?.$jazz.id === reminder.$jazz.id),
		).toBe(true)
	})

	test("throws when reminder not found", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await expect(
			updateReminder(owner, {
				personId: person.$jazz.id,
				reminderId: "co_zNope",
				text: "x",
			}),
		).rejects.toBeDefined()
	})

	test("repeat unit month advances by one month", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "monthly",
			dueAtDate: "2099-01-15",
			repeat: { interval: 1, unit: "month" },
		})

		let result = await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})

		expect(result.current.dueAtDate).toBe("2099-02-15")

		let reloaded = await Reminder.load(reminder.$jazz.id)
		expect(reloaded?.$isLoaded ? reloaded.dueAtDate : null).toBe("2099-02-15")
	})
})
