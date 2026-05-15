import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import {
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"
import { getReferenceDate, getDeletedDate } from "./reminder-dates"

describe("getReferenceDate", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns updatedAt when present", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "call",
			dueAtDate: "2025-06-01",
		})
		let date = getReferenceDate(reminder)
		expect(date).toEqual(reminder.updatedAt)
	})

	test("returns a Date instance", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "call",
			dueAtDate: "2025-06-01",
		})
		expect(getReferenceDate(reminder)).toBeInstanceOf(Date)
	})
})

describe("getDeletedDate", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns deletedAt when present", async () => {
		let deletedAt = new Date("2025-03-01")
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "old",
			dueAtDate: "2025-02-01",
			deletedAt,
		})
		expect(getDeletedDate(reminder)).toEqual(deletedAt)
	})

	test("falls back to reference date when not deleted", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "active",
			dueAtDate: "2025-06-01",
		})
		expect(getDeletedDate(reminder)).toEqual(getReferenceDate(reminder))
	})
})
