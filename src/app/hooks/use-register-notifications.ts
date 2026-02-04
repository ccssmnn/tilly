import { useEffect, useRef } from "react"
import { useAccount } from "jazz-tools/react"
import {
	Group,
	generateAuthToken,
	type co,
	type ResolveQuery,
} from "jazz-tools"
import { PUBLIC_JAZZ_WORKER_ACCOUNT } from "astro:env/client"
import { UserAccount } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import {
	migrateNotificationSettings,
	addServerToGroup,
} from "#app/lib/notification-settings-migration"
import { triggerNotificationRegistration } from "#app/lib/notification-registration"
import { findLatestFutureDate } from "#app/lib/reminder-utils"

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
		console.log("[Notifications] Migrating to shareable group")
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
		// Update root to point to new settings
		me.root.$jazz.set("notificationSettings", migrationResult.data)
		notificationSettings = migrationResult.data
		console.log("[Notifications] Migration complete")
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

	console.log("[Notifications] Registration successful")
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
