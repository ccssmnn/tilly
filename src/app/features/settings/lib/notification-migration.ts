export { copyNotificationSettingsData }
export type { NotificationSettingsInput }

type NotificationSettingsInput = {
	version: 1
	timezone?: string
	notificationTime?: string
	lastDeliveredAt?: Date
	language?: "de" | "en"
	latestReminderDueDate?: string
	pushDevices: Array<{
		isEnabled: boolean
		deviceName: string
		endpoint: string
		keys: { p256dh: string; auth: string }
	}>
}

type NotificationSettingsLike = {
	timezone?: string
	notificationTime?: string
	lastDeliveredAt?: Date
	language?: "de" | "en"
	latestReminderDueDate?: string
	pushDevices: Array<{
		isEnabled: boolean
		deviceName: string
		endpoint: string
		keys: { p256dh: string; auth: string }
	}>
}

function copyNotificationSettingsData(
	settings: NotificationSettingsLike,
	rootLanguage?: "de" | "en",
): NotificationSettingsInput {
	return {
		version: 1,
		timezone: settings.timezone,
		notificationTime: settings.notificationTime,
		lastDeliveredAt: settings.lastDeliveredAt,
		language: settings.language || rootLanguage,
		latestReminderDueDate: settings.latestReminderDueDate,
		pushDevices: settings.pushDevices.map(device => ({
			isEnabled: device.isEnabled,
			deviceName: device.deviceName,
			endpoint: device.endpoint,
			keys: {
				p256dh: device.keys.p256dh,
				auth: device.keys.auth,
			},
		})),
	}
}
