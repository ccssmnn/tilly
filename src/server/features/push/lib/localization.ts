import { createIntl } from "@ccssmnn/intl"
import { messagesEn, messagesDe } from "#shared/intl/messages"
import {
	baseServerMessages,
	deServerMessages,
} from "#shared/intl/messages.server"

export { getIntl, getLocalizedMessages }

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
