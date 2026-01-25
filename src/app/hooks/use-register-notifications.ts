import { useEffect, useRef } from "react"
import { useAccount } from "jazz-tools/react"
import { Group, type co, type ResolveQuery, type ID } from "jazz-tools"
import { PUBLIC_JAZZ_WORKER_ACCOUNT } from "astro:env/client"
import { UserAccount, NotificationSettings } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"
import { apiClient } from "#app/lib/api-client"
import { tryCatch } from "#shared/lib/trycatch"

export { useRegisterNotifications }

let notificationSettingsQuery = {
	root: { notificationSettings: true },
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
		registerNotificationSettings(me)
	}, [me.$isLoaded, me])
}

async function registerNotificationSettings(me: LoadedAccount): Promise<void> {
	let notificationSettings = me.root.notificationSettings
	if (!notificationSettings) return

	// Sync language from root to notification settings
	let rootLanguage = me.root.language
	if (rootLanguage && notificationSettings.language !== rootLanguage) {
		notificationSettings.$jazz.set("language", rootLanguage)
	}

	// Check if settings are owned by a shareable group
	// The key difference: if owner is an Account vs a Group
	let owner = notificationSettings.$jazz.owner
	let isShareableGroup = owner instanceof Group

	if (!isShareableGroup) {
		// Need to migrate to a shareable group
		let migrationResult = await tryCatch(
			migrateNotificationSettings(me, notificationSettings),
		)
		if (!migrationResult.ok) {
			console.error("[Notifications] Migration failed:", migrationResult.error)
			return
		}
		notificationSettings = migrationResult.data
	} else {
		// Ensure server worker is a member
		let group = owner as Group
		let serverAccountId = PUBLIC_JAZZ_WORKER_ACCOUNT
		let serverIsMember = group.members.some(
			m => m.account?.$jazz.id === serverAccountId,
		)
		if (!serverIsMember) {
			let addResult = await tryCatch(
				addServerToGroup(me, group, serverAccountId),
			)
			if (!addResult.ok) {
				console.error(
					"[Notifications] Failed to add server to group:",
					addResult.error,
				)
			}
		}
	}

	// Register with server
	let registerResult = await tryCatch(
		apiClient.push.register.$post({
			json: { notificationSettingsId: notificationSettings.$jazz.id },
		}),
	)

	if (!registerResult.ok) {
		console.error("[Notifications] Registration failed:", registerResult.error)
		return
	}

	if (!registerResult.data.ok) {
		let errorData = await tryCatch(registerResult.data.json())
		console.error(
			"[Notifications] Registration error:",
			errorData.ok ? errorData.data : "Unknown error",
		)
		return
	}

	console.log("[Notifications] Registration successful")
}

async function migrateNotificationSettings(
	me: LoadedAccount,
	oldSettings: co.loaded<typeof NotificationSettings>,
): Promise<co.loaded<typeof NotificationSettings>> {
	console.log("[Notifications] Migrating to shareable group")

	// Create new group with current user as owner
	let group = Group.create()

	// Add server worker as writer
	let serverAccountId = PUBLIC_JAZZ_WORKER_ACCOUNT
	await addServerToGroup(me, group, serverAccountId)

	// Create new notification settings in the new group
	let newSettings = NotificationSettings.create(
		{
			version: 1,
			timezone: oldSettings.timezone,
			notificationTime: oldSettings.notificationTime,
			lastDeliveredAt: oldSettings.lastDeliveredAt,
			pushDevices: [...oldSettings.pushDevices],
			language: oldSettings.language || me.root.language,
		},
		{ owner: group },
	)

	// Update root to point to new settings
	me.root.$jazz.set("notificationSettings", newSettings)

	console.log("[Notifications] Migration complete")
	return newSettings
}

async function addServerToGroup(
	me: LoadedAccount,
	group: Group,
	serverAccountId: string,
): Promise<void> {
	// Load the server account to add as member
	let serverAccount = await ServerAccount.load(
		serverAccountId as ID<typeof ServerAccount>,
		{ loadAs: me },
	)

	if (!serverAccount || !serverAccount.$isLoaded) {
		throw new Error("Failed to load server account")
	}

	group.addMember(serverAccount, "writer")
}
