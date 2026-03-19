import { format, toZonedTime } from "date-fns-tz"
import type { MessageMetadata, TillyUIMessage } from "#shared/tools/tools"

export { addUserContextToMessage }

function addUserContextToMessage(message: TillyUIMessage): TillyUIMessage {
	if (message.role !== "user") return message

	let meta = message.metadata
	if (!meta) return message

	let context = buildUserContext(meta)
	if (!context) return message

	let contextPrefix = "<context>"

	if (Array.isArray(message.parts) && message.parts.length > 0) {
		let parts = message.parts.map(part => ({ ...part }))
		let firstTextIndex = parts.findIndex(part => part.type === "text")

		if (firstTextIndex === -1) {
			return {
				...message,
				parts: [{ type: "text", text: context }, ...parts],
			}
		}

		let firstTextPart = parts[firstTextIndex]
		if (firstTextPart.type === "text") {
			if (firstTextPart.text.startsWith(contextPrefix)) {
				return { ...message, parts }
			}

			parts[firstTextIndex] = {
				...firstTextPart,
				text: context + firstTextPart.text,
			}
		}

		return { ...message, parts }
	}

	return { ...message, parts: [{ type: "text", text: context }] }
}

function buildUserContext(meta: MessageMetadata): string | null {
	if (typeof meta.timestamp !== "number") return null
	if (!meta.userName || !meta.timezone || !meta.locale) return null

	let userLocalTime = toZonedTime(new Date(meta.timestamp), meta.timezone)
	let weekday = format(userLocalTime, "EEEE")
	let date = format(userLocalTime, "MMMM d, yyyy")
	let time = format(userLocalTime, "h:mm a")

	let payload = JSON.stringify({
		name: meta.userName,
		locale: meta.locale,
		timezone: meta.timezone,
		timestamp: meta.timestamp,
		localTime: { weekday, date, time },
	})

	return `<context>${payload}</context>`
}
