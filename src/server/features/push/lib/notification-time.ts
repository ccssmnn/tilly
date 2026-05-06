import { toZonedTime, format, fromZonedTime } from "date-fns-tz"

export { isPastNotificationTime, wasDeliveredToday }
export type { NotificationTimeSettings }

type NotificationTimeSettings = {
	timezone?: string
	notificationTime?: string
	lastDeliveredAt?: Date
}

function isPastNotificationTime(
	settings: NotificationTimeSettings,
	currentUtc: Date,
): boolean {
	let userTimezone = settings.timezone || "UTC"
	let userNotificationTime = settings.notificationTime || "12:00"

	let userLocalTime = toZonedTime(currentUtc, userTimezone)
	let userLocalTimeStr = format(userLocalTime, "HH:mm")

	return userLocalTimeStr >= userNotificationTime
}

function wasDeliveredToday(
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
