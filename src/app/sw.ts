/// <reference lib="webworker" />

/**
 * Push notification auth strategy:
 *
 * We use the cached reminders (keyed by userId) as the source of truth for
 * whether a user is signed in. This eliminates the need for separate userId
 * caching because:
 *
 * 1. Push payloads always include userId - if missing, we suppress anyway
 * 2. Reminders are synced with userId via SET_REMINDERS message
 * 3. When user signs out, reminders sync stops → cache becomes stale
 * 4. On push, we check if payload.userId matches reminders cache key
 *    - Match + has due reminders → show notification
 *    - No match → clear stale cache, suppress notification
 */

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
	| {
			type: "SET_REMINDERS"
			userId: string
			reminders: ReminderData[]
			todayStr: string
	  }

type NotificationPayload = {
	title?: string
	titleOne?: string
	titleMany?: string
	body: string
	icon: string
	badge: string
	tag: string
	userId?: string
	url?: string
	count?: number
	isTest?: boolean
}

let sw = self
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

	if (data.type === "SET_REMINDERS") {
		event.waitUntil(
			setRemindersInCache(data.userId, data.reminders, data.todayStr),
		)
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
	// Test notifications always show (use count from payload or default to 1)
	if (notificationData.isTest) {
		await showNotification(notificationData, notificationData.count ?? 1)
		return
	}

	let payloadUserId = notificationData.userId
	if (!payloadUserId) {
		return
	}

	// getRemindersFromCache returns null + clears cache if userId doesn't match
	let cached = await getRemindersFromCache(payloadUserId)
	if (!cached) {
		return
	}

	let count = getDueReminderCount(cached.reminders, cached.todayStr)
	if (count === 0) {
		return
	}

	if (await isUserOnPage(notificationData.url)) {
		return
	}

	await showNotification(notificationData, count)
}

async function showNotification(
	notificationData: NotificationPayload,
	count: number,
): Promise<void> {
	let titleTemplate =
		count === 1
			? (notificationData.titleOne ?? notificationData.title ?? "")
			: (notificationData.titleMany ?? notificationData.title ?? "")
	let title = titleTemplate.replace("{count}", String(count))
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
		} catch {
			return
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
	if (typeValue === "SET_REMINDERS") {
		let userIdValue = Reflect.get(value, "userId")
		let remindersValue = Reflect.get(value, "reminders")
		let todayStrValue = Reflect.get(value, "todayStr")
		if (
			typeof userIdValue === "string" &&
			Array.isArray(remindersValue) &&
			typeof todayStrValue === "string"
		) {
			return {
				type: "SET_REMINDERS",
				userId: userIdValue,
				reminders: remindersValue,
				todayStr: todayStrValue,
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
	} catch {
		parsed = null
	}

	if (parsed && typeof parsed === "object") {
		let stringKeys = [
			"title",
			"titleOne",
			"titleMany",
			"body",
			"icon",
			"badge",
			"tag",
			"userId",
			"url",
		] as const
		for (let key of stringKeys) {
			let value = Reflect.get(parsed, key)
			if (typeof value === "string") {
				result[key] = value
			}
		}
		let countValue = Reflect.get(parsed, "count")
		if (typeof countValue === "number") {
			result.count = countValue
		}
		let isTestValue = Reflect.get(parsed, "isTest")
		if (typeof isTestValue === "boolean") {
			result.isTest = isTestValue
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
	let stringKeys = [
		"title",
		"titleOne",
		"titleMany",
		"body",
		"icon",
		"badge",
		"tag",
		"userId",
		"url",
	] as const
	for (let key of stringKeys) {
		let field = Reflect.get(value, key)
		if (typeof field === "string") {
			merged[key] = field
		}
	}
	let countField = Reflect.get(value, "count")
	if (typeof countField === "number") {
		merged.count = countField
	}
	let isTestField = Reflect.get(value, "isTest")
	if (typeof isTestField === "boolean") {
		merged.isTest = isTestField
	}
	return merged
}

function isWindowClient(client: Client): client is WindowClient {
	return typeof Reflect.get(client, "focus") === "function"
}

async function setRemindersInCache(
	userId: string,
	reminders: ReminderData[],
	todayStr: string,
): Promise<void> {
	try {
		let cache = await caches.open(REMINDERS_CACHE)
		let data = JSON.stringify({ [userId]: { reminders, todayStr } })
		await cache.put("reminders", new Response(data))
	} catch {
		return
	}
}

async function getRemindersFromCache(
	userId: string,
): Promise<{ reminders: ReminderData[]; todayStr: string } | null> {
	try {
		let cache = await caches.open(REMINDERS_CACHE)
		let response = await cache.match("reminders")
		if (!response) {
			return null
		}
		let data = await response.json()
		let result = data[userId] || null
		return result
	} catch {
		return null
	}
}

function getDueReminderCount(
	reminders: ReminderData[],
	todayStr: string,
): number {
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
	} catch {
		return false
	}
}
