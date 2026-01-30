import { describe, test, expect } from "vitest"
import {
	copyNotificationSettingsData,
	type NotificationSettingsInput,
} from "./notification-settings-migration"

describe("copyNotificationSettingsData", () => {
	test("copies all settings fields", () => {
		let mockSettings: NotificationSettingsInput = {
			timezone: "America/New_York",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T14:00:00Z"),
			language: "de" as const,
			latestReminderDueDate: "2025-02-01",
			pushDevices: [
				{
					isEnabled: true,
					deviceName: "iPhone",
					endpoint: "https://push.example.com/abc123",
					keys: { p256dh: "key1", auth: "auth1" },
				},
			],
		}

		let result = copyNotificationSettingsData(mockSettings, undefined)

		expect(result.timezone).toBe("America/New_York")
		expect(result.notificationTime).toBe("09:00")
		expect(result.lastDeliveredAt).toEqual(new Date("2025-01-15T14:00:00Z"))
		expect(result.language).toBe("de")
		expect(result.latestReminderDueDate).toBe("2025-02-01")
		expect(result.pushDevices).toHaveLength(1)
		expect(result.pushDevices[0].deviceName).toBe("iPhone")
	})

	test("uses rootLanguage when settings language is undefined", () => {
		let mockSettings: NotificationSettingsInput = {
			timezone: "UTC",
			notificationTime: "12:00",
			pushDevices: [],
		}

		let result = copyNotificationSettingsData(mockSettings, "de")

		expect(result.language).toBe("de")
	})

	test("preserves settings language over rootLanguage", () => {
		let mockSettings: NotificationSettingsInput = {
			timezone: "UTC",
			notificationTime: "12:00",
			language: "en" as const,
			pushDevices: [],
		}

		let result = copyNotificationSettingsData(mockSettings, "de")

		expect(result.language).toBe("en")
	})

	test("copies multiple devices", () => {
		let mockSettings: NotificationSettingsInput = {
			timezone: "UTC",
			pushDevices: [
				{
					isEnabled: true,
					deviceName: "Device 1",
					endpoint: "https://push.example.com/1",
					keys: { p256dh: "key1", auth: "auth1" },
				},
				{
					isEnabled: false,
					deviceName: "Device 2",
					endpoint: "https://push.example.com/2",
					keys: { p256dh: "key2", auth: "auth2" },
				},
			],
		}

		let result = copyNotificationSettingsData(mockSettings, undefined)

		expect(result.pushDevices).toHaveLength(2)
		expect(result.pushDevices[0].isEnabled).toBe(true)
		expect(result.pushDevices[1].isEnabled).toBe(false)
	})

	test("handles undefined optional fields", () => {
		let mockSettings: NotificationSettingsInput = {
			pushDevices: [],
		}

		let result = copyNotificationSettingsData(mockSettings, undefined)

		expect(result.timezone).toBeUndefined()
		expect(result.notificationTime).toBeUndefined()
		expect(result.lastDeliveredAt).toBeUndefined()
		expect(result.language).toBeUndefined()
		expect(result.latestReminderDueDate).toBeUndefined()
	})
})
