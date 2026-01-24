import { describe, test, expect } from "vitest"
import {
	isPastNotificationTime,
	wasDeliveredToday,
	type NotificationTimeSettings,
} from "./push-cron-utils"

describe("isPastNotificationTime", () => {
	test("returns true when current time is past notification time", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(true)
	})

	test("returns false when current time is before notification time", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		let currentUtc = new Date("2025-01-15T08:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(false)
	})

	test("returns true when current time equals notification time", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		let currentUtc = new Date("2025-01-15T09:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(true)
	})

	test("handles timezone conversion correctly", () => {
		let settings: NotificationTimeSettings = {
			timezone: "America/New_York", // UTC-5
			notificationTime: "09:00",
		}
		// 14:00 UTC = 09:00 EST
		let currentUtc = new Date("2025-01-15T14:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(true)

		// 13:00 UTC = 08:00 EST
		let beforeUtc = new Date("2025-01-15T13:00:00Z")
		expect(isPastNotificationTime(settings, beforeUtc)).toBe(false)
	})

	test("defaults to 12:00 when notificationTime not set", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
		}
		let atNoon = new Date("2025-01-15T12:00:00Z")
		expect(isPastNotificationTime(settings, atNoon)).toBe(true)

		let beforeNoon = new Date("2025-01-15T11:59:00Z")
		expect(isPastNotificationTime(settings, beforeNoon)).toBe(false)
	})
})

describe("wasDeliveredToday", () => {
	test("returns false when never delivered", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("returns false when last delivered yesterday", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-14T09:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("returns true when delivered today after notification time", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T09:30:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})

	test("returns true when delivered exactly at notification time", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T09:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})

	test("returns false when delivered today but before notification time", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T08:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("handles timezone correctly - delivered in user's today", () => {
		let settings: NotificationTimeSettings = {
			timezone: "America/New_York",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T14:30:00Z"),
		}
		let currentUtc = new Date("2025-01-15T15:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})

	test("handles timezone correctly - different calendar days UTC vs local", () => {
		let settings: NotificationTimeSettings = {
			timezone: "America/New_York",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T03:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T15:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("allows re-delivery after midnight in user timezone", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-14T09:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T09:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("prevents duplicate delivery within same notification window", () => {
		let settings: NotificationTimeSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T09:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T18:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})
})
