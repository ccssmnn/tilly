import { PUBLIC_VAPID_KEY } from "astro:env/client"
import { getServiceWorkerRegistration } from "#app/lib/service-worker"
import { tryCatch } from "#shared/lib/trycatch"

export {
	subscribeToPushNotifications,
	unsubscribeFromPushNotifications,
	requestNotificationPermission,
	getNotificationPermission,
	arrayBufferToBase64,
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!("Notification" in window)) {
		throw new Error("This browser does not support notifications")
	}

	if (!("serviceWorker" in navigator)) {
		throw new Error("This browser does not support service workers")
	}

	let permission = await Notification.requestPermission()
	return permission
}

function getNotificationPermission(): NotificationPermission {
	if (!("Notification" in window)) {
		return "denied"
	}
	return Notification.permission
}

async function subscribeToPushNotifications(): Promise<{
	endpoint: string
	keys: {
		p256dh: string
		auth: string
	}
}> {
	console.log("[Push] Starting subscription flow...")

	let registrationResult = await tryCatch(getServiceWorkerRegistration())
	if (!registrationResult.ok) {
		console.error(
			"[Push] Failed to get SW registration:",
			registrationResult.error,
		)
		throw new Error("Failed to get service worker registration")
	}

	let registration = registrationResult.data
	if (!registration) {
		console.error(
			"[Push] SW registration is null — no service worker at /app/ scope",
		)
		throw new Error("Service worker not registered")
	}

	console.log("[Push] SW registration found:", registration.scope)

	if (!PUBLIC_VAPID_KEY) {
		console.error("[Push] PUBLIC_VAPID_KEY is empty/undefined")
		throw new Error("VAPID public key not configured")
	}

	console.log(
		"[Push] Subscribing with VAPID key:",
		PUBLIC_VAPID_KEY.slice(0, 20) + "...",
	)

	// Check for existing subscription first
	let existingSub = await registration.pushManager.getSubscription()
	if (existingSub) {
		console.log("[Push] Found existing subscription, unsubscribing first...")
		await existingSub.unsubscribe()
	}

	let subscriptionResult = await tryCatch(
		registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: PUBLIC_VAPID_KEY,
		}),
	)

	if (!subscriptionResult.ok) {
		console.error("[Push] Subscribe failed:", subscriptionResult.error)
		throw new Error("Failed to subscribe to push notifications")
	}

	let subscription = subscriptionResult.data
	console.log("[Push] Subscription created:", {
		endpoint: subscription.endpoint,
		expirationTime: subscription.expirationTime,
	})

	let p256dh = subscription.getKey("p256dh")
	let auth = subscription.getKey("auth")

	if (!p256dh || !auth) {
		throw new Error(
			`received '${auth}' for auth and '${p256dh}' for p256dh, both must be nonempty`,
		)
	}

	return {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: arrayBufferToBase64(p256dh),
			auth: arrayBufferToBase64(auth),
		},
	}
}

async function unsubscribeFromPushNotifications(): Promise<boolean> {
	let registrationResult = await tryCatch(getServiceWorkerRegistration())
	if (!registrationResult.ok) {
		return false
	}

	let registration = registrationResult.data
	if (!registration) {
		return false
	}

	let subscriptionResult = await tryCatch(
		registration.pushManager.getSubscription(),
	)
	if (!subscriptionResult.ok) {
		return false
	}

	let subscription = subscriptionResult.data
	if (subscription) {
		let unsubscribeResult = await tryCatch(subscription.unsubscribe())
		return unsubscribeResult.ok ? unsubscribeResult.data : false
	}

	return false
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	let bytes = new Uint8Array(buffer)
	let binary = ""
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return window.btoa(binary)
}
