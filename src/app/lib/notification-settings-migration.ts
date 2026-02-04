import { Account, Group, type co, type ID, deleteCoValues } from "jazz-tools"
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
	cleanup: () => Promise<void>
}> {
	let group = Group.create()

	await addServerToGroup(group, serverAccountId, context)

	let settingsData = copyNotificationSettingsData(
		oldSettings,
		context.rootLanguage,
	)

	let newSettings = NotificationSettings.create(settingsData, { owner: group })

	let cleanup = async () => {
		let owner = oldSettings.$jazz.owner
		if (owner instanceof Group) {
			let hasAdminPermission = owner.members.some(
				m =>
					m.account?.$jazz.id === context.loadAs.$jazz.id && m.role === "admin",
			)
			if (!hasAdminPermission) {
				console.error(
					"[NotificationSettingsMigration] Caller lacks admin permission on owning group",
				)
				throw new Error("Caller lacks admin permission on owning group")
			}
		}

		try {
			await deleteCoValues(NotificationSettings, oldSettings.$jazz.id)
		} catch (error) {
			console.error(
				"[NotificationSettingsMigration] Failed to delete old settings:",
				error,
			)
			throw error
		}
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
