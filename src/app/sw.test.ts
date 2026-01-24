import { describe, test, expect } from "vitest"
import { countDueReminders, interpolateCount } from "./sw-utils"

describe("countDueReminders", () => {
	test("returns 0 for empty reminders", () => {
		expect(countDueReminders([], "2025-01-15")).toBe(0)
	})

	test("counts reminders due today", () => {
		let reminders = [{ dueAtDate: "2025-01-15" }, { dueAtDate: "2025-01-16" }]
		expect(countDueReminders(reminders, "2025-01-15")).toBe(1)
	})

	test("counts reminders due in the past", () => {
		let reminders = [
			{ dueAtDate: "2025-01-10" },
			{ dueAtDate: "2025-01-14" },
			{ dueAtDate: "2025-01-15" },
		]
		expect(countDueReminders(reminders, "2025-01-15")).toBe(3)
	})

	test("excludes future reminders", () => {
		let reminders = [{ dueAtDate: "2025-01-16" }, { dueAtDate: "2025-02-01" }]
		expect(countDueReminders(reminders, "2025-01-15")).toBe(0)
	})

	test("handles year boundary", () => {
		let reminders = [
			{ dueAtDate: "2024-12-31" },
			{ dueAtDate: "2025-01-01" },
			{ dueAtDate: "2025-01-02" },
		]
		expect(countDueReminders(reminders, "2025-01-01")).toBe(2)
	})
})

describe("interpolateCount", () => {
	test("replaces {count} with number", () => {
		expect(interpolateCount("You have {count} reminders", 5)).toBe(
			"You have 5 reminders",
		)
	})

	test("handles count of 1", () => {
		expect(interpolateCount("You have {count} reminders", 1)).toBe(
			"You have 1 reminders",
		)
	})

	test("handles count of 0", () => {
		expect(interpolateCount("You have {count} reminders", 0)).toBe(
			"You have 0 reminders",
		)
	})

	test("returns unchanged string if no placeholder", () => {
		expect(interpolateCount("No placeholder here", 5)).toBe(
			"No placeholder here",
		)
	})
})
