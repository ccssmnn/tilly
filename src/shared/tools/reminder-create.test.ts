import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Reminder, UserAccount } from "#shared/schema/user"
import { createReminder } from "#shared/tools/reminder-create"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"

describe("createReminder", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("attaches a reminder with text + dueAtDate", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createReminder(owner, {
			personId: person.$jazz.id,
			text: "call back",
			dueAtDate: "2099-01-01",
		})

		expect(result.operation).toBe("create")
		expect(result.current.text).toBe("call back")
		expect(result.current.dueAtDate).toBe("2099-01-01")
		expect(result.current.done).toBe(false)

		let loaded = await person.$jazz.ensureLoaded({
			resolve: { reminders: { $each: true } },
		})
		expect(
			loaded.reminders.some(r => r?.$jazz.id === result.current.reminderId),
		).toBe(true)
	})

	test("persists repeat config", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createReminder(owner, {
			personId: person.$jazz.id,
			text: "weekly",
			dueAtDate: "2099-01-01",
			repeat: { interval: 1, unit: "week" },
		})

		let reloaded = await Reminder.load(result.current.reminderId)
		expect(reloaded?.$isLoaded).toBe(true)
		if (!reloaded?.$isLoaded) return
		expect(reloaded.repeat?.interval).toBe(1)
		expect(reloaded.repeat?.unit).toBe("week")
	})

	test("throws when person not found", async () => {
		await expect(
			createReminder(owner, {
				personId: "co_zNope",
				text: "x",
				dueAtDate: "2099-01-01",
			}),
		).rejects.toBeDefined()
	})

	describe("multi-user", () => {
		test("writer collaborator can create on shared person", async () => {
			let collaborator = await createAccount()
			let person = await seedPerson(owner, {
				name: "Shared",
				sharedWith: collaborator,
			})
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			let result = await createReminder(collaborator, {
				personId: person.$jazz.id,
				text: "from other",
				dueAtDate: "2099-01-01",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let loaded = await person.$jazz.ensureLoaded({
				resolve: { reminders: { $each: true } },
			})
			expect(
				loaded.reminders.some(r => r?.$jazz.id === result.current.reminderId),
			).toBe(true)
		})
	})
})
