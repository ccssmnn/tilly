import { createIntl } from "@ccssmnn/intl"
import { messagesEn, messagesDe } from "#shared/intl/messages"
import {
	baseServerMessages,
	deServerMessages,
} from "#shared/intl/messages.server"
import type { NotificationPayload } from "./send-notification"

export {
	getIntl,
	getLocalizedMessages,
	createLocalizedNotificationPayload,
	createTestPayload,
}

function getIntl(worker: { root: { language?: string } }) {
	let userLanguage = worker.root.language || "en"

	if (userLanguage === "de") {
		return createIntl(messagesDe, "de")
	} else {
		return createIntl(messagesEn, "en")
	}
}

function getLocalizedMessages(worker: { root: { language?: string } }) {
	let userLanguage = worker.root.language || "en"
	return userLanguage === "de" ? deServerMessages : baseServerMessages
}

function createLocalizedNotificationPayload(
	userId: string,
	language: string | undefined,
): NotificationPayload {
	let messages = language === "de" ? deServerMessages : baseServerMessages
	return {
		titleOne: messages["server.push.dueReminders.titleOne"],
		titleMany: messages["server.push.dueReminders.titleMany"],
		body: messages["server.push.dueReminders.body"],
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		url: "/app/reminders",
		userId,
	}
}

function createTestPayload(
	language: string | undefined,
	userId: string,
): NotificationPayload {
	let t =
		language === "de"
			? createIntl(messagesDe, "de")
			: createIntl(messagesEn, "en")
	return {
		title: t("server.push.test-title"),
		body: t("server.push.test-body"),
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		url: "/app/settings",
		userId,
	}
}
