import { Account, Group, type co, type ID } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"

export {
	migrateNotificationSettings,
	addServerToGroup,
	copyNotificationSettingsData,
}
export type { MigrationContext, NotificationSettingsInput }

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

type MigrationContext = {
	loadAs: Account
	rootLanguage?: "de" | "en"
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

async function migrateNotificationSettings(
	oldSettings: co.loaded<typeof NotificationSettings>,
	serverAccountId: string,
	context: MigrationContext,
): Promise<{
	newSettings: co.loaded<typeof NotificationSettings>
	cleanup: () => void
}> {
	let group = Group.create()

	await addServerToGroup(group, serverAccountId, context)

	let settingsData = copyNotificationSettingsData(
		oldSettings,
		context.rootLanguage,
	)

	let newSettings = NotificationSettings.create(settingsData, { owner: group })

	let cleanup = () => {
		oldSettings.$jazz.raw.core.deleteCoValue()
	}

	return { newSettings, cleanup }
}

async function addServerToGroup(
	group: Group,
	serverAccountId: string,
	context: MigrationContext,
): Promise<void> {
	let serverAccount = await ServerAccount.load(
		serverAccountId as ID<typeof ServerAccount>,
		{ loadAs: context.loadAs },
	)

	if (!serverAccount || !serverAccount.$isLoaded) {
		throw new Error("Failed to load server account")
	}

	group.addMember(serverAccount, "writer")
}
