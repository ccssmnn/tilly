import { useEffect, useRef } from "react"
import { useAccount } from "jazz-tools/react"
import {
	Account,
	Group,
	generateAuthToken,
	deleteCoValues,
	type co,
	type ID,
	type ResolveQuery,
} from "jazz-tools"
import { PUBLIC_JAZZ_WORKER_ACCOUNT } from "astro:env/client"
import { NotificationSettings, UserAccount } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"
import { tryCatch } from "#shared/lib/trycatch"
import { apiClient } from "#app/lib/api-client"
import { findLatestFutureDate } from "#app/features/reminders"

export { useRegisterNotifications }

let notificationSettingsQuery = {
	root: {
		notificationSettings: true,
		people: { $each: { reminders: { $each: true } } },
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAccount = co.loaded<
	typeof UserAccount,
	typeof notificationSettingsQuery
>

/**
 * Hook that registers notification settings with the server.
 * Handles migration from account-owned to group-owned settings.
 * Runs once on app start.
 */
function useRegisterNotifications(): void {
	let registrationRan = useRef(false)
	let me = useAccount(UserAccount, { resolve: notificationSettingsQuery })

	useEffect(() => {
		if (registrationRan.current || !me.$isLoaded) return
		if (!me.root.notificationSettings) return

		registrationRan.current = true
		registerNotificationSettings(me).catch(error => {
			console.error("[Notifications] Registration error:", error)
			registrationRan.current = false
		})
	}, [me.$isLoaded, me])
}

async function registerNotificationSettings(me: LoadedAccount): Promise<void> {
	let notificationSettings = me.root.notificationSettings
	if (!notificationSettings) return

	let serverAccountId = PUBLIC_JAZZ_WORKER_ACCOUNT
	if (!serverAccountId) {
		console.error("[Notifications] PUBLIC_JAZZ_WORKER_ACCOUNT not configured")
		return
	}

	// Sync language from root to notification settings
	let rootLanguage = me.root.language
	if (rootLanguage && notificationSettings.language !== rootLanguage) {
		notificationSettings.$jazz.set("language", rootLanguage)
	}

	// Compute and sync latestReminderDueDate
	let latestDueDate = computeLatestReminderDueDate(me)
	if (latestDueDate !== notificationSettings.latestReminderDueDate) {
		notificationSettings.$jazz.set("latestReminderDueDate", latestDueDate)
	}

	// Check if settings are owned by a shareable group
	// The key difference: if owner is an Account vs a Group
	let owner = notificationSettings.$jazz.owner
	let isShareableGroup = owner instanceof Group

	if (!isShareableGroup) {
		let migrationResult = await tryCatch(
			migrateNotificationSettings(notificationSettings, serverAccountId, {
				loadAs: me,
				rootLanguage,
			}),
		)
		if (!migrationResult.ok) {
			console.error("[Notifications] Migration failed:", migrationResult.error)
			return
		}
		let { newSettings, cleanup } = migrationResult.data
		// Update root to point to new settings before cleanup
		me.root.$jazz.set("notificationSettings", newSettings)
		// Defer cleanup to next tick so new settings are persisted first
		setTimeout(cleanup, 0)
		notificationSettings = newSettings
	} else {
		// Ensure server worker is a member
		let group = owner as Group
		let serverIsMember = group.members.some(
			m => m.account?.$jazz.id === serverAccountId,
		)
		if (!serverIsMember) {
			let addResult = await tryCatch(
				addServerToGroup(group, serverAccountId, { loadAs: me }),
			)
			if (!addResult.ok) {
				console.error(
					"[Notifications] Failed to add server to group:",
					addResult.error,
				)
			}
		}
	}

	// Register with server using Jazz auth
	let authToken = generateAuthToken(me)
	let registerResult = await triggerNotificationRegistration(
		notificationSettings.$jazz.id,
		authToken,
	)

	if (!registerResult.ok) {
		console.error("[Notifications] Registration failed:", registerResult.error)
		return
	}
}

function computeLatestReminderDueDate(me: LoadedAccount): string | undefined {
	let reminders = extractReminders(me)
	let timezone =
		me.root.notificationSettings?.timezone ||
		Intl.DateTimeFormat().resolvedOptions().timeZone
	let today = new Date()
		.toLocaleDateString("sv-SE", { timeZone: timezone })
		.slice(0, 10)
	return findLatestFutureDate(reminders, today)
}

function extractReminders(
	me: LoadedAccount,
): { dueAtDate: string; deleted: boolean; done: boolean }[] {
	let reminders: { dueAtDate: string; deleted: boolean; done: boolean }[] = []
	for (let person of me.root.people.values()) {
		if (!person || person.deletedAt) continue
		for (let reminder of person.reminders.values()) {
			if (!reminder) continue
			reminders.push({
				dueAtDate: reminder.dueAtDate,
				deleted: !!reminder.deletedAt,
				done: !!reminder.done,
			})
		}
	}
	return reminders
}

type RegistrationResult = { ok: true } | { ok: false; error: string }

async function triggerNotificationRegistration(
	notificationSettingsId: string,
	authToken: string,
): Promise<RegistrationResult> {
	let result = await tryCatch(
		apiClient.push.register.$post(
			{
				json: { notificationSettingsId },
			},
			{
				headers: {
					Authorization: `Jazz ${authToken}`,
				},
			},
		),
	)

	if (!result.ok) {
		console.error("[Notifications] Registration failed:", result.error)
		return { ok: false, error: "Network error" }
	}

	if (!result.data.ok) {
		let errorData = await tryCatch(
			result.data.json() as Promise<{ message?: string }>,
		)
		let errorMessage = errorData.ok
			? errorData.data.message || "Unknown error"
			: "Unknown error"
		console.error("[Notifications] Registration error:", errorMessage)
		return { ok: false, error: errorMessage }
	}

	return { ok: true }
}

type MigrationContext = {
	loadAs: Account
	rootLanguage?: "de" | "en"
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

	let settingsData = {
		version: 1 as const,
		timezone: oldSettings.timezone,
		notificationTime: oldSettings.notificationTime,
		lastDeliveredAt: oldSettings.lastDeliveredAt,
		language: oldSettings.language || context.rootLanguage,
		latestReminderDueDate: oldSettings.latestReminderDueDate,
		pushDevices: oldSettings.pushDevices.map(device => ({
			isEnabled: device.isEnabled,
			deviceName: device.deviceName,
			endpoint: device.endpoint,
			keys: {
				p256dh: device.keys.p256dh,
				auth: device.keys.auth,
			},
		})),
	}

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
