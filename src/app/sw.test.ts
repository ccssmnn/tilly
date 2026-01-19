import { describe, test, expect } from "vitest"

// Extract pure functions for testing (matches sw.ts logic)
type ReminderData = { id: string; dueAtDate: string }

function getDueReminderCount(
	reminders: ReminderData[],
	todayStr: string,
): number {
	let count = 0
	for (let r of reminders) {
		if (r.dueAtDate <= todayStr) count++
	}
	return count
}

function interpolateCount(text: string, count: number): string {
	return text.replace("{count}", String(count))
}

describe("getDueReminderCount", () => {
	test("returns 0 for empty reminders", () => {
		expect(getDueReminderCount([], "2025-01-15")).toBe(0)
	})

	test("counts reminders due today", () => {
		let reminders: ReminderData[] = [
			{ id: "1", dueAtDate: "2025-01-15" },
			{ id: "2", dueAtDate: "2025-01-16" },
		]
		expect(getDueReminderCount(reminders, "2025-01-15")).toBe(1)
	})

	test("counts reminders due in the past", () => {
		let reminders: ReminderData[] = [
			{ id: "1", dueAtDate: "2025-01-10" },
			{ id: "2", dueAtDate: "2025-01-14" },
			{ id: "3", dueAtDate: "2025-01-15" },
		]
		expect(getDueReminderCount(reminders, "2025-01-15")).toBe(3)
	})

	test("excludes future reminders", () => {
		let reminders: ReminderData[] = [
			{ id: "1", dueAtDate: "2025-01-16" },
			{ id: "2", dueAtDate: "2025-02-01" },
		]
		expect(getDueReminderCount(reminders, "2025-01-15")).toBe(0)
	})

	test("handles year boundary", () => {
		let reminders: ReminderData[] = [
			{ id: "1", dueAtDate: "2024-12-31" },
			{ id: "2", dueAtDate: "2025-01-01" },
			{ id: "3", dueAtDate: "2025-01-02" },
		]
		expect(getDueReminderCount(reminders, "2025-01-01")).toBe(2)
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
