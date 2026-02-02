import { apiClient } from "#app/lib/api-client"
import { tryCatch } from "#shared/lib/trycatch"

export { triggerNotificationRegistration }

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
		let errorData = await tryCatch(result.data.json())
		let errorMessage = errorData.ok
			? (errorData.data as { message?: string }).message || "Unknown error"
			: "Unknown error"
		console.error("[Notifications] Registration error:", errorMessage)
		return { ok: false, error: errorMessage }
	}

	console.log("[Notifications] Registration triggered successfully")
	return { ok: true }
}
