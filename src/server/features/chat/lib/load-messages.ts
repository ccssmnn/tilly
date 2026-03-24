import { convertToModelMessages } from "ai"
import { format, toZonedTime } from "date-fns-tz"
import { Result } from "better-result"
import { co, type ResolveQuery } from "jazz-tools"
import { MAX_REQUEST_TOKENS } from "astro:env/server"
import { UserAccount } from "#shared/schema/user"
import {
	clientTools,
	type MessageMetadata,
	type TillyUIMessage,
} from "#shared/tools/tools"
import { EmptyMessages, InputTooLarge } from "#server/lib/errors"
import { estimateTokenCount } from "#server/lib/chat-usage"

export { loadAndValidateMessages }

let messagesQuery = {
	root: { assistant: { stringifiedMessages: true } },
} as const satisfies ResolveQuery<typeof UserAccount>

function loadAndValidateMessages(worker: co.loaded<typeof UserAccount>) {
	return Result.await(
		Result.tryPromise({
			try: async () => {
				let resolved = await worker.$jazz.ensureLoaded({
					resolve: messagesQuery,
				})
				let assistant = resolved.root.assistant
				if (!assistant) {
					throw new EmptyMessages({ message: "No messages to process" })
				}

				let messages = assistant.stringifiedMessages
					.map((s: string) => JSON.parse(s) as TillyUIMessage)
					.map(addUserContext)

				if (messages.length === 0) {
					throw new EmptyMessages({ message: "No messages to process" })
				}

				let modelMessages = await convertToModelMessages(messages, {
					ignoreIncompleteToolCalls: true,
					tools: clientTools,
				})

				let overflow = Math.max(
					0,
					estimateTokenCount(modelMessages) - MAX_REQUEST_TOKENS,
				)
				if (overflow !== 0) {
					throw new InputTooLarge({
						message: `Messages size exceed limit by ${overflow}`,
						overflow,
					})
				}

				return { modelMessages, worker: resolved, assistant }
			},
			catch: error => {
				if (error instanceof EmptyMessages) return error
				if (error instanceof InputTooLarge) return error
				throw error
			},
		}),
	)
}

function addUserContext(message: TillyUIMessage): TillyUIMessage {
	if (message.role !== "user") return message

	let meta = message.metadata
	if (!meta) return message

	let context = buildContextString(meta)
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

function buildContextString(meta: MessageMetadata): string | null {
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
