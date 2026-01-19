/// <reference lib="webworker" />

import {
	cleanupOutdatedCaches,
	createHandlerBoundToURL,
	precacheAndRoute,
} from "workbox-precaching"
import { registerRoute, NavigationRoute } from "workbox-routing"

declare let self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ url: string; revision?: string }>
}

type ReminderData = { id: string; dueAtDate: string }

type MessageEventData =
	| { type: "SKIP_WAITING" }
	| { type: "SET_USER_ID"; userId: string }
	| { type: "CLEAR_USER_ID" }
	| { type: "SET_REMINDERS"; userId: string; reminders: ReminderData[] }

type NotificationPayload = {
	title: string
	body: string
	icon: string
	badge: string
	tag: string
	userId?: string
	url?: string
	count?: number
}

let sw = self
let USER_CACHE = "tilly-user-v1"
let REMINDERS_CACHE = "tilly-reminders-v1"

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Serve precached /app for all /app/* navigations (offline-first SPA)
registerRoute(
	new NavigationRoute(createHandlerBoundToURL("/app"), {
		allowlist: [/^\/app(\/|$)/],
	}),
)

sw.addEventListener("message", event => {
	let data = parseMessageEventData(event.data)
	if (!data) return

	if (data.type === "SKIP_WAITING") {
		sw.skipWaiting()
		return
	}

	if (data.type === "SET_USER_ID") {
		event.waitUntil(setUserIdInCache(data.userId))
		return
	}

	if (data.type === "CLEAR_USER_ID") {
		event.waitUntil(clearUserIdFromCache())
		return
	}

	if (data.type === "SET_REMINDERS") {
		event.waitUntil(setRemindersInCache(data.userId, data.reminders))
	}
})

sw.addEventListener("push", event => {
	let notificationData = mergeNotificationPayload(
		getDefaultNotificationPayload(),
		event.data,
	)
	event.waitUntil(validateAuthAndShowNotification(notificationData))
})

sw.addEventListener("notificationclick", event => {
	event.notification.close()

	if (event.action === "dismiss") {
		return
	}

	let notificationData = toNotificationPayload(event.notification.data)
	let targetUrl = notificationData?.url || "/app/reminders"

	event.waitUntil(openOrFocusClient(targetUrl))
})

async function validateAuthAndShowNotification(
	notificationData: NotificationPayload,
): Promise<void> {
	let currentUserId = await getUserIdFromCache()

	if (!currentUserId) {
		console.log("[SW] No user ID stored, suppressing notification")
		return
	}

	if (!notificationData.userId) {
		console.log("[SW] No userId in payload, suppressing notification")
		return
	}

	if (currentUserId !== notificationData.userId) {
		console.log(
			"[SW] User ID mismatch, suppressing notification",
			currentUserId,
			notificationData.userId,
		)
		return
	}

	if (await isUserOnPage(notificationData.url)) {
		console.log(
			"[SW] User already on target page, suppressing notification",
			notificationData.url,
		)
		return
	}

	let reminders = await getRemindersFromCache(currentUserId)
	let count = reminders ? getDueReminderCount(reminders) : 0

	if (count === 0) {
		console.log("[SW] No due reminders, suppressing notification")
		return
	}

	await showNotification(notificationData, count)
}

async function showNotification(
	notificationData: NotificationPayload,
	count: number,
): Promise<void> {
	let title = notificationData.title.replace("{count}", String(count))
	let body = notificationData.body.replace("{count}", String(count))

	await sw.registration.showNotification(title, {
		body,
		icon: notificationData.icon,
		badge: notificationData.badge,
		tag: notificationData.tag,
		requireInteraction: false,
		data: { ...notificationData, count },
	})

	let setAppBadge = Reflect.get(sw.registration, "setAppBadge")
	if (typeof setAppBadge === "function") {
		try {
			await setAppBadge.call(sw.registration, count)
		} catch (error) {
			console.log("[SW] Unable to set app badge:", error)
		}
	}
}

async function openOrFocusClient(targetUrl: string): Promise<void> {
	let clientList = await sw.clients.matchAll({
		type: "window",
		includeUncontrolled: true,
	})

	for (let client of clientList) {
		if (isWindowClient(client) && client.url.includes("/app")) {
			await client.focus()
			if (typeof client.navigate === "function") {
				await client.navigate(targetUrl)
			}
			return
		}
	}

	for (let client of clientList) {
		if (isWindowClient(client) && client.url.startsWith(sw.location.origin)) {
			await client.focus()
			if (typeof client.navigate === "function") {
				await client.navigate(targetUrl)
			}
			return
		}
	}

	if (sw.clients.openWindow) {
		await sw.clients.openWindow(targetUrl)
	}
}

function parseMessageEventData(value: unknown): MessageEventData | null {
	if (typeof value !== "object" || value === null) return null
	let typeValue = Reflect.get(value, "type")
	if (typeValue === "SKIP_WAITING") {
		return { type: "SKIP_WAITING" }
	}
	if (typeValue === "SET_USER_ID") {
		let userIdValue = Reflect.get(value, "userId")
		if (typeof userIdValue === "string") {
			return { type: "SET_USER_ID", userId: userIdValue }
		}
	}
	if (typeValue === "CLEAR_USER_ID") {
		return { type: "CLEAR_USER_ID" }
	}
	if (typeValue === "SET_REMINDERS") {
		let userIdValue = Reflect.get(value, "userId")
		let remindersValue = Reflect.get(value, "reminders")
		if (typeof userIdValue === "string" && Array.isArray(remindersValue)) {
			return {
				type: "SET_REMINDERS",
				userId: userIdValue,
				reminders: remindersValue,
			}
		}
	}
	return null
}

function getDefaultNotificationPayload(): NotificationPayload {
	return {
		title: "Tilly",
		body: "You have a new notification",
		icon: "/app/icons/icon-192x192.png",
		badge: "/app/icons/transparent-96x96.png",
		tag: "tilly-notification",
	}
}

function mergeNotificationPayload(
	base: NotificationPayload,
	eventData: PushMessageData | null,
): NotificationPayload {
	let result = { ...base }
	if (!eventData) return result

	let parsed: unknown = null
	try {
		parsed = eventData.json()
	} catch (error) {
		console.log("[SW] Error parsing push data:", error)
	}

	if (parsed && typeof parsed === "object") {
		let keys: Array<keyof NotificationPayload> = [
			"title",
			"body",
			"icon",
			"badge",
			"tag",
			"userId",
			"url",
			"count",
		]
		for (let key of keys) {
			let value = Reflect.get(parsed, key)
			if (value === undefined || value === null) continue
			if (key === "count") {
				if (typeof value === "number") {
					result.count = value
				}
				continue
			}
			if (typeof value === "string") {
				result[key] = value
			}
		}
		return result
	}

	if (typeof eventData.text === "function") {
		let fallback = eventData.text()
		if (typeof fallback === "string" && fallback.length > 0) {
			result.body = fallback
		}
	}
	return result
}

function toNotificationPayload(value: unknown): NotificationPayload | null {
	if (typeof value !== "object" || value === null) return null
	let merged = { ...getDefaultNotificationPayload() }
	let keys: Array<keyof NotificationPayload> = [
		"title",
		"body",
		"icon",
		"badge",
		"tag",
		"userId",
		"url",
		"count",
	]
	for (let key of keys) {
		let field = Reflect.get(value, key)
		if (field === undefined || field === null) continue
		if (key === "count") {
			if (typeof field === "number") {
				merged.count = field
			}
			continue
		}
		if (typeof field === "string") {
			merged[key] = field
		}
	}
	return merged
}

function isWindowClient(client: Client): client is WindowClient {
	return typeof Reflect.get(client, "focus") === "function"
}

async function getUserIdFromCache(): Promise<string | null> {
	try {
		let cache = await caches.open(USER_CACHE)
		let response = await cache.match("user-id")
		if (!response) return null
		return await response.text()
	} catch (error) {
		console.log("[SW] Error loading user ID from cache:", error)
		return null
	}
}

async function setUserIdInCache(userId: string): Promise<void> {
	try {
		let cache = await caches.open(USER_CACHE)
		await cache.put("user-id", new Response(userId))
	} catch (error) {
		console.log("[SW] Error caching user ID:", error)
	}
}

async function clearUserIdFromCache(): Promise<void> {
	try {
		let cache = await caches.open(USER_CACHE)
		await cache.delete("user-id")
	} catch (error) {
		console.log("[SW] Error clearing user ID from cache:", error)
	}
}

async function setRemindersInCache(
	userId: string,
	reminders: ReminderData[],
): Promise<void> {
	try {
		let cache = await caches.open(REMINDERS_CACHE)
		let data = JSON.stringify({ [userId]: reminders })
		await cache.put("reminders", new Response(data))
	} catch (error) {
		console.log("[SW] Error caching reminders:", error)
	}
}

async function getRemindersFromCache(
	userId: string,
): Promise<ReminderData[] | null> {
	try {
		let cache = await caches.open(REMINDERS_CACHE)
		let response = await cache.match("reminders")
		if (!response) return null
		let data = await response.json()
		return data[userId] || null
	} catch (error) {
		console.log("[SW] Error loading reminders from cache:", error)
		return null
	}
}

function getDueReminderCount(reminders: ReminderData[]): number {
	let today = new Date()
	let todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
	let count = 0
	for (let r of reminders) {
		if (r.dueAtDate <= todayStr) count++
	}
	return count
}

async function isUserOnPage(targetUrl?: string): Promise<boolean> {
	if (!targetUrl) return false

	try {
		let clientList = await sw.clients.matchAll({
			type: "window",
			includeUncontrolled: true,
		})

		for (let client of clientList) {
			if (
				isWindowClient(client) &&
				client.focused &&
				client.url.includes(targetUrl)
			) {
				return true
			}
		}

		return false
	} catch (error) {
		console.log("[SW] Error checking if user is on page:", error)
		return false
	}
}
