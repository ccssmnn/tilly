import { apiClient } from "#app/lib/api-client"
import { tryCatch } from "#shared/lib/trycatch"

export { triggerNotificationRegistration }

/**
 * Triggers notification settings registration with the server.
 * Call this after adding a new push device.
 */
async function triggerNotificationRegistration(
	notificationSettingsId: string,
): Promise<void> {
	let result = await tryCatch(
		apiClient.push.register.$post({
			json: { notificationSettingsId },
		}),
	)

	if (!result.ok) {
		console.error("[Notifications] Registration failed:", result.error)
		return
	}

	if (!result.data.ok) {
		let errorData = await tryCatch(result.data.json())
		console.error(
			"[Notifications] Registration error:",
			errorData.ok ? errorData.data : "Unknown error",
		)
		return
	}

	console.log("[Notifications] Registration triggered successfully")
}
