import { convertToModelMessages } from "ai"
import { format, toZonedTime } from "date-fns-tz"
import { Result } from "better-result"
import type { Loaded, ResolveQuery } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import {
	clientTools,
	type MessageMetadata,
	type TillyUIMessage,
} from "#shared/tools/tools"
import { EmptyMessages } from "#server/lib/errors"

export { loadModelMessages, messagesQuery }
export type { WorkerWithMessages }

let messagesQuery = {
	root: { assistant: { stringifiedMessages: true } },
} as const satisfies ResolveQuery<typeof UserAccount>

type WorkerWithMessages = Loaded<typeof UserAccount, typeof messagesQuery>

function loadModelMessages(worker: WorkerWithMessages) {
	return Result.await(
		Result.tryPromise({
			try: async () => {
				let messages = worker.root.assistant?.stringifiedMessages
					.map((s: string) => JSON.parse(s) as TillyUIMessage)
					.map(addUserContext)

				if (!messages || messages.length === 0) {
					throw new EmptyMessages({ message: "No messages to process" })
				}

				return convertToModelMessages(messages, {
					ignoreIncompleteToolCalls: true,
					tools: clientTools,
				})
			},
			catch: error => {
				if (error instanceof EmptyMessages) return error
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
