import { beforeEach, describe, test, expect } from "vitest"
import {
	createJazzTestAccount,
	setupJazzTestSync,
	setActiveAccount,
} from "jazz-tools/testing"
import { Group, co } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import { ServerAccount, ServerAccountRoot } from "#shared/schema/server"
import { registerNotificationSettingsWithServer } from "./push-register-logic"

describe("registerNotificationSettingsWithServer", () => {
	let serverAccount: co.loaded<typeof ServerAccount>
	let userAccount: co.loaded<typeof ServerAccount>

	beforeEach(async () => {
		await setupJazzTestSync()

		serverAccount = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: ServerAccount,
		})

		// Initialize server root manually since test accounts may not run migrations
		if (!serverAccount.root) {
			serverAccount.$jazz.set("root", ServerAccountRoot.create({}))
		}

		userAccount = await createJazzTestAccount({
			AccountSchema: ServerAccount,
		})
	})

	test("registers new notification settings", async () => {
		setActiveAccount(userAccount)

		let group = Group.create()
		group.addMember(serverAccount, "writer")

		let notificationSettings = NotificationSettings.create(
			{
				version: 1,
				timezone: "UTC",
				notificationTime: "09:00",
				pushDevices: [],
			},
			{ owner: group },
		)

		await userAccount.$jazz.waitForAllCoValuesSync()
		await serverAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let result = await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)

		expect(result.ok).toBe(true)

		let loadedServer = await serverAccount.$jazz.ensureLoaded({
			resolve: { root: { notificationSettingsRefs: { $each: true } } },
		})
		let refs = loadedServer.root.notificationSettingsRefs
		let refEntries = refs ? Object.entries(refs) : []
		expect(refEntries.length).toBe(1)
		expect(refEntries[0]?.[0]).toBe(notificationSettings.$jazz.id)
		expect(refEntries[0]?.[1]?.userId).toBe("test-user-123")
	})

	test("updates lastSyncedAt for existing registration", async () => {
		setActiveAccount(userAccount)

		let group = Group.create()
		group.addMember(serverAccount, "writer")

		let notificationSettings = NotificationSettings.create(
			{
				version: 1,
				timezone: "UTC",
				notificationTime: "09:00",
				pushDevices: [],
			},
			{ owner: group },
		)

		await userAccount.$jazz.waitForAllCoValuesSync()
		await serverAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let firstResult = await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)
		expect(firstResult.ok).toBe(true)

		let loadedServer = await serverAccount.$jazz.ensureLoaded({
			resolve: { root: { notificationSettingsRefs: { $each: true } } },
		})
		let refs = loadedServer.root.notificationSettingsRefs
		let firstSyncTime = refs?.[notificationSettings.$jazz.id]?.lastSyncedAt

		await new Promise(r => setTimeout(r, 10))

		await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)

		loadedServer = await serverAccount.$jazz.ensureLoaded({
			resolve: { root: { notificationSettingsRefs: { $each: true } } },
		})

		refs = loadedServer.root.notificationSettingsRefs
		let refEntries = refs ? Object.entries(refs) : []
		expect(refEntries.length).toBe(1)

		let secondSyncTime = refs?.[notificationSettings.$jazz.id]?.lastSyncedAt
		expect(secondSyncTime?.getTime()).toBeGreaterThan(firstSyncTime!.getTime())
	})

	test("returns error when server cannot access settings", async () => {
		setActiveAccount(userAccount)

		let notificationSettings = NotificationSettings.create({
			version: 1,
			timezone: "UTC",
			notificationTime: "09:00",
			pushDevices: [],
		})

		await userAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let result = await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)

		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.status).toBe(400)
			expect(result.error).toContain("ensure server has access")
		}
	})
})
