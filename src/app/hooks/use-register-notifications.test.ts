import { describe, test, expect } from "vitest"
import { findLatestFutureDate } from "#app/lib/reminder-utils"

describe("findLatestFutureDate", () => {
	let today = "2025-01-15"

	test("returns undefined for empty list", () => {
		expect(findLatestFutureDate([], today)).toBeUndefined()
	})

	test("returns undefined when all reminders are in the past", () => {
		let reminders = [
			{ dueAtDate: "2025-01-10", deleted: false, done: false },
			{ dueAtDate: "2025-01-14", deleted: false, done: false },
		]
		expect(findLatestFutureDate(reminders, today)).toBeUndefined()
	})

	test("returns the only future reminder", () => {
		let reminders = [{ dueAtDate: "2025-01-20", deleted: false, done: false }]
		expect(findLatestFutureDate(reminders, today)).toBe("2025-01-20")
	})

	test("returns today's date as valid future", () => {
		let reminders = [{ dueAtDate: "2025-01-15", deleted: false, done: false }]
		expect(findLatestFutureDate(reminders, today)).toBe("2025-01-15")
	})

	test("returns the latest of multiple future reminders", () => {
		let reminders = [
			{ dueAtDate: "2025-01-20", deleted: false, done: false },
			{ dueAtDate: "2025-02-15", deleted: false, done: false },
			{ dueAtDate: "2025-01-25", deleted: false, done: false },
		]
		expect(findLatestFutureDate(reminders, today)).toBe("2025-02-15")
	})

	test("ignores deleted reminders", () => {
		let reminders = [
			{ dueAtDate: "2025-02-15", deleted: true, done: false },
			{ dueAtDate: "2025-01-20", deleted: false, done: false },
		]
		expect(findLatestFutureDate(reminders, today)).toBe("2025-01-20")
	})

	test("ignores done reminders", () => {
		let reminders = [
			{ dueAtDate: "2025-02-15", deleted: false, done: true },
			{ dueAtDate: "2025-01-20", deleted: false, done: false },
		]
		expect(findLatestFutureDate(reminders, today)).toBe("2025-01-20")
	})

	test("returns undefined when all future reminders are deleted or done", () => {
		let reminders = [
			{ dueAtDate: "2025-02-15", deleted: true, done: false },
			{ dueAtDate: "2025-01-20", deleted: false, done: true },
			{ dueAtDate: "2025-01-10", deleted: false, done: false },
		]
		expect(findLatestFutureDate(reminders, today)).toBeUndefined()
	})
})
