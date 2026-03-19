import { describe, test, expect } from "vitest"
import { isStaleRef } from "./stale-ref"

describe("isStaleRef", () => {
	let now = new Date("2025-01-15T12:00:00Z")

	test("returns false when synced yesterday", () => {
		let lastSyncedAt = new Date("2025-01-14T12:00:00Z")
		expect(isStaleRef(lastSyncedAt, undefined, now)).toBe(false)
	})

	test("returns false when synced 29 days ago", () => {
		let lastSyncedAt = new Date("2024-12-17T12:00:00Z")
		expect(isStaleRef(lastSyncedAt, undefined, now)).toBe(false)
	})

	test("returns true when synced 31 days ago with no reminders", () => {
		let lastSyncedAt = new Date("2024-12-15T12:00:00Z")
		expect(isStaleRef(lastSyncedAt, undefined, now)).toBe(true)
	})

	test("returns true when synced 31 days ago with past reminder", () => {
		let lastSyncedAt = new Date("2024-12-15T12:00:00Z")
		let pastReminder = "2025-01-10"
		expect(isStaleRef(lastSyncedAt, pastReminder, now)).toBe(true)
	})

	test("returns false when synced 31 days ago but has future reminder", () => {
		let lastSyncedAt = new Date("2024-12-15T12:00:00Z")
		let futureReminder = "2025-01-20"
		expect(isStaleRef(lastSyncedAt, futureReminder, now)).toBe(false)
	})

	test("returns false when synced 31 days ago but has reminder today", () => {
		let lastSyncedAt = new Date("2024-12-15T12:00:00Z")
		let todayReminder = "2025-01-15"
		expect(isStaleRef(lastSyncedAt, todayReminder, now)).toBe(false)
	})

	test("returns true when both sync and reminder are old", () => {
		let lastSyncedAt = new Date("2024-11-01T12:00:00Z")
		let oldReminder = "2024-12-01"
		expect(isStaleRef(lastSyncedAt, oldReminder, now)).toBe(true)
	})
})
