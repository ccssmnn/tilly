import { merge, check } from "@ccssmnn/intl"

// Consolidated catalog modules
import { basePeopleMessages, dePeopleMessages } from "./messages.people"
import {
	baseRemindersMessages,
	deRemindersMessages,
} from "./messages.reminders"
import { baseNotesMessages, deNotesMessages } from "./messages.notes"
import { baseSettingsMessages, deSettingsMessages } from "./messages.settings"
import {
	baseAssistantMessages,
	deAssistantMessages,
} from "./messages.assistant"
import { baseUiMessages, deUiMessages } from "./messages.ui"
import { baseServerMessages, deServerMessages } from "./messages.server"
import { baseTourMessages, deTourMessages } from "./messages.tour"

export { messagesEn, messagesDe }

let messagesEn = merge(
	basePeopleMessages,
	baseRemindersMessages,
	baseNotesMessages,
	baseSettingsMessages,
	baseAssistantMessages,
	baseUiMessages,
	baseServerMessages,
	baseTourMessages,
)

let messagesDe = check(
	messagesEn,
	dePeopleMessages,
	deRemindersMessages,
	deNotesMessages,
	deSettingsMessages,
	deAssistantMessages,
	deUiMessages,
	deServerMessages,
	deTourMessages,
)
