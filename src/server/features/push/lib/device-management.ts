import { UserAccount } from "#shared/schema/user"
import type { co, ResolveQuery } from "jazz-tools"
import type { PushDevice } from "./send-notification"

export {
	getEnabledDevices,
	removeDeviceByEndpoint,
	markAsDelivered,
	settingsQuery,
}
export type { LoadedNotificationSettings, LoadedUserAccountSettings }

let settingsQuery = {
	root: { notificationSettings: true },
} satisfies ResolveQuery<typeof UserAccount>

type LoadedUserAccountSettings = co.loaded<
	typeof UserAccount,
	typeof settingsQuery
>
type LoadedNotificationSettings = NonNullable<
	LoadedUserAccountSettings["root"]["notificationSettings"]
>

function getEnabledDevices(
	notificationSettings: LoadedNotificationSettings,
): PushDevice[] {
	let devices = notificationSettings.pushDevices.filter(d => d.isEnabled) || []
	return devices
}

function removeDeviceByEndpoint(
	notificationSettings: LoadedNotificationSettings,
	endpoint: string,
) {
	let devices = notificationSettings.pushDevices
	let index = devices.findIndex(d => d.endpoint === endpoint)
	if (index !== -1) {
		devices.splice(index, 1)
		console.log(`🗑️ Removed stale device: ${endpoint.slice(-10)}`)
	}
}

function markAsDelivered(
	notificationSettings: LoadedNotificationSettings,
	currentUtc: Date,
) {
	notificationSettings.$jazz.set("lastDeliveredAt", currentUtc)
}
