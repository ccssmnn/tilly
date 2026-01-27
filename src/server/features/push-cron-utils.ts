import { toZonedTime, format, fromZonedTime } from "date-fns-tz"

let STALE_THRESHOLD_DAYS = 30

export type NotificationTimeSettings = {
	timezone?: string
	notificationTime?: string
	lastDeliveredAt?: Date
}

export function isPastNotificationTime(
	settings: NotificationTimeSettings,
	currentUtc: Date,
): boolean {
	let userTimezone = settings.timezone || "UTC"
	let userNotificationTime = settings.notificationTime || "12:00"

	let userLocalTime = toZonedTime(currentUtc, userTimezone)
	let userLocalTimeStr = format(userLocalTime, "HH:mm")

	return userLocalTimeStr >= userNotificationTime
}

export function wasDeliveredToday(
	settings: NotificationTimeSettings,
	currentUtc: Date,
): boolean {
	if (!settings.lastDeliveredAt) return false

	let userTimezone = settings.timezone || "UTC"
	let userNotificationTime = settings.notificationTime || "12:00"
	let userLocalTime = toZonedTime(currentUtc, userTimezone)
	let userLocalDate = format(userLocalTime, "yyyy-MM-dd")

	let lastDeliveredUserTime = toZonedTime(
		settings.lastDeliveredAt,
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

	return settings.lastDeliveredAt >= todayNotificationUtc
}

export function isStaleRef(
	lastSyncedAt: Date,
	latestReminderDueDate: string | undefined,
	now: Date = new Date(),
): boolean {
	let staleThreshold = new Date(now)
	staleThreshold.setDate(staleThreshold.getDate() - STALE_THRESHOLD_DAYS)

	// Keep if app was opened recently
	if (lastSyncedAt >= staleThreshold) return false

	// Keep if there's a reminder today or in the future
	if (latestReminderDueDate) {
		let todayStr = now.toISOString().slice(0, 10)
		if (latestReminderDueDate >= todayStr) return false
	}

	return true
}
