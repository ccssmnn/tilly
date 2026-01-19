import { describe, test, expect } from "vitest"
import { toZonedTime, format, fromZonedTime } from "date-fns-tz"

// Extract pure functions for testing (matches push-cron.ts logic)
type NotificationSettings = {
	timezone?: string
	notificationTime?: string
	lastDeliveredAt?: Date
}

function isPastNotificationTime(
	notificationSettings: NotificationSettings,
	currentUtc: Date,
): boolean {
	let userTimezone = notificationSettings.timezone || "UTC"
	let userNotificationTime = notificationSettings.notificationTime || "12:00"

	let userLocalTime = toZonedTime(currentUtc, userTimezone)
	let userLocalTimeStr = format(userLocalTime, "HH:mm")

	return userLocalTimeStr >= userNotificationTime
}

function wasDeliveredToday(
	notifications: NotificationSettings,
	currentUtc: Date,
): boolean {
	if (!notifications.lastDeliveredAt) return false

	let userTimezone = notifications.timezone || "UTC"
	let userNotificationTime = notifications.notificationTime || "12:00"
	let userLocalTime = toZonedTime(currentUtc, userTimezone)
	let userLocalDate = format(userLocalTime, "yyyy-MM-dd")

	let lastDeliveredUserTime = toZonedTime(
		notifications.lastDeliveredAt,
		userTimezone,
	)
	let lastDeliveredDate = format(lastDeliveredUserTime, "yyyy-MM-dd")

	if (lastDeliveredDate !== userLocalDate) return false

	let todayNotificationDateTime = new Date(
		`${userLocalDate}T${userNotificationTime}:00`,
	)
	let todayNotificationUtc = fromZonedTime(
		todayNotificationDateTime,
		userTimezone,
	)

	return notifications.lastDeliveredAt >= todayNotificationUtc
}

describe("isPastNotificationTime", () => {
	test("returns true when current time is past notification time", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		// 10:00 UTC
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(true)
	})

	test("returns false when current time is before notification time", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		// 08:00 UTC
		let currentUtc = new Date("2025-01-15T08:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(false)
	})

	test("returns true when current time equals notification time", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		// 09:00 UTC
		let currentUtc = new Date("2025-01-15T09:00:00Z")
		expect(isPastNotificationTime(settings, currentUtc)).toBe(true)
	})

	test("handles timezone conversion correctly", () => {
		let settings: NotificationSettings = {
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
		let settings: NotificationSettings = {
			timezone: "UTC",
		}
		// 12:00 UTC
		let atNoon = new Date("2025-01-15T12:00:00Z")
		expect(isPastNotificationTime(settings, atNoon)).toBe(true)

		// 11:59 UTC
		let beforeNoon = new Date("2025-01-15T11:59:00Z")
		expect(isPastNotificationTime(settings, beforeNoon)).toBe(false)
	})
})

describe("wasDeliveredToday", () => {
	test("returns false when never delivered", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("returns false when last delivered yesterday", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-14T09:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("returns true when delivered today after notification time", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T09:30:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})

	test("returns true when delivered exactly at notification time", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T09:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})

	test("returns false when delivered today but before notification time", () => {
		// Edge case: delivered at 08:00, notification time is 09:00
		// This means it was delivered for the previous day's notification window
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T08:00:00Z"),
		}
		let currentUtc = new Date("2025-01-15T10:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("handles timezone correctly - delivered in user's today", () => {
		let settings: NotificationSettings = {
			timezone: "America/New_York", // UTC-5
			notificationTime: "09:00",
			// 14:30 UTC = 09:30 EST on Jan 15
			lastDeliveredAt: new Date("2025-01-15T14:30:00Z"),
		}
		// 15:00 UTC = 10:00 EST on Jan 15
		let currentUtc = new Date("2025-01-15T15:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})

	test("handles timezone correctly - different calendar days UTC vs local", () => {
		let settings: NotificationSettings = {
			timezone: "America/New_York", // UTC-5
			notificationTime: "09:00",
			// 03:00 UTC Jan 15 = 22:00 EST Jan 14
			lastDeliveredAt: new Date("2025-01-15T03:00:00Z"),
		}
		// 15:00 UTC Jan 15 = 10:00 EST Jan 15
		let currentUtc = new Date("2025-01-15T15:00:00Z")
		// Last delivery was on Jan 14 in user's timezone, so should return false
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("allows re-delivery after midnight in user timezone", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-14T09:00:00Z"),
		}
		// Next day, after notification time
		let currentUtc = new Date("2025-01-15T09:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(false)
	})

	test("prevents duplicate delivery within same notification window", () => {
		let settings: NotificationSettings = {
			timezone: "UTC",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T09:00:00Z"),
		}
		// Same day, later in the day
		let currentUtc = new Date("2025-01-15T18:00:00Z")
		expect(wasDeliveredToday(settings, currentUtc)).toBe(true)
	})
})
