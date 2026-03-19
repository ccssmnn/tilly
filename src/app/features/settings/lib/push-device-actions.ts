import { generateAuthToken } from "jazz-tools"
import type { co } from "jazz-tools"
import type { z } from "zod"
import type { PushDevice, UserAccount } from "#shared/schema/user"
import { toast } from "sonner"
import { apiClient } from "#app/lib/api-client"
import { tryCatch } from "#shared/lib/trycatch"
import type { useIntl } from "#shared/intl/setup"
import { getServiceWorkerRegistration } from "#app/lib/service-worker"
import type {
	NotificationQuery,
	NotificationSettingsType,
} from "./notification-types"

export {
	handleToggleDeviceEnabled,
	handleSendTestNotification,
	handleRemoveDevice,
	handleSaveDeviceName,
	deletePushDevice,
	updatePushDevice,
}
export type { DeviceInfo }

interface DeviceInfo {
	isEnabled: boolean
	deviceName: string
	endpoint: string
	keys: {
		p256dh: string
		auth: string
	}
}

async function handleToggleDeviceEnabled(
	device: DeviceInfo,
	isCurrentDevice: boolean,
	notifications: NotificationSettingsType | undefined,
	t: ReturnType<typeof useIntl>,
) {
	if (device.isEnabled && isCurrentDevice) {
		let unsubscribeResult = await tryCatch(unsubscribeFromPushNotifications())
		if (!unsubscribeResult.ok) {
			toast.error(t("notifications.toast.unsubscribeFailed"))
			return
		}
	}

	updatePushDevice(
		device.endpoint,
		{ isEnabled: !device.isEnabled },
		notifications,
	)
}

async function handleSendTestNotification(
	endpoint: string,
	me: co.loaded<typeof UserAccount, NotificationQuery>,
	t: ReturnType<typeof useIntl>,
) {
	let authToken = generateAuthToken(me)
	let result = await tryCatch(
		apiClient.push["send-test-notification"].$post(
			{
				json: { endpoint },
			},
			{
				headers: {
					Authorization: `Jazz ${authToken}`,
				},
			},
		),
	)

	if (!result.ok) {
		toast.error(t("notifications.toast.testSendFailed"))
		return
	}

	if (result.data.ok) {
		let data = await tryCatch(
			result.data.json() as Promise<{ message?: string; error?: string }>,
		)
		if (data.ok) {
			toast.success(
				data.data.message || t("notifications.toast.testSendSuccess"),
			)
		} else {
			toast.success(t("notifications.toast.testSendSuccess"))
		}
	} else {
		let data = await tryCatch(
			result.data.json() as Promise<{ message?: string; error?: string }>,
		)
		let message =
			data.ok && "message" in data.data
				? data.data.message
				: t("notifications.toast.testSendFailed")
		toast.error(message)
	}
}

async function handleRemoveDevice(
	endpoint: string,
	isCurrentDevice: boolean,
	notifications: NotificationSettingsType | undefined,
	refreshEndpoint: () => void,
	t: ReturnType<typeof useIntl>,
) {
	if (isCurrentDevice) {
		let unsubscribeResult = await tryCatch(unsubscribeFromPushNotifications())
		if (!unsubscribeResult.ok) {
			toast.error(t("notifications.toast.unsubscribeFailed"))
			return
		}
	}

	deletePushDevice(endpoint, notifications, refreshEndpoint)
	toast.success(t("notifications.toast.deviceRemoved"))
}

function handleSaveDeviceName(
	endpoint: string,
	editName: string,
	notifications: NotificationSettingsType | undefined,
	onClose: () => void,
	t: ReturnType<typeof useIntl>,
) {
	if (editName.trim()) {
		updatePushDevice(endpoint, { deviceName: editName.trim() }, notifications)
		onClose()
		toast.success(t("notifications.toast.nameUpdated"))
	}
}

function deletePushDevice(
	endpoint: string,
	notifications: NotificationSettingsType | undefined,
	refreshEndpoint: () => void,
) {
	if (!notifications) return

	notifications.$jazz.set(
		"pushDevices",
		notifications.pushDevices.filter(d => d.endpoint !== endpoint),
	)
	refreshEndpoint()
}

function updatePushDevice(
	endpoint: string,
	updates: Partial<z.infer<typeof PushDevice>>,
	notifications: NotificationSettingsType | undefined,
) {
	if (!notifications) return

	notifications.$jazz.set(
		"pushDevices",
		notifications.pushDevices.map(d =>
			d.endpoint === endpoint ? { ...d, ...updates } : d,
		),
	)
}

async function unsubscribeFromPushNotifications(): Promise<boolean> {
	let registrationResult = await tryCatch(getServiceWorkerRegistration())
	if (!registrationResult.ok) return false

	let registration = registrationResult.data
	if (!registration) return false

	let subscriptionResult = await tryCatch(
		registration.pushManager.getSubscription(),
	)
	if (!subscriptionResult.ok) return false

	let subscription = subscriptionResult.data
	if (subscription) {
		let unsubscribeResult = await tryCatch(subscription.unsubscribe())
		return unsubscribeResult.ok ? unsubscribeResult.data : false
	}

	return false
}
