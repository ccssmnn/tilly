import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type TextStreamPart,
} from "ai"
import { GOOGLE_AI_API_KEY } from "astro:env/server"
import { format, toZonedTime } from "date-fns-tz"
import { Hono } from "hono"
import { nanoid } from "nanoid"

import {
	clientTools,
	createServerTools,
	type MessageMetadata,
	type TillyUIMessage,
} from "#shared/tools/tools"
import { z } from "zod"
import { authMiddleware, requireAuth } from "../lib/auth-middleware"
import { requirePlus, type SubscriptionStatus } from "../lib/chat-subscription"
import {
	checkInputSize,
	checkUsageLimits,
	updateUsage,
} from "../lib/chat-usage"
import { initUserWorker } from "#server/lib/utils"
import type { User } from "@clerk/backend"

export { chatMessagesApp }

let chatMessagesApp = new Hono()
	.use("*", authMiddleware)
	.use("*", requireAuth)
	.use("*", requirePlus)
	.post("/", async c => {
		let user = c.get("user")
		let subscriptionStatus = c.get("subscription")
		let { worker } = await initUserWorker(user)

		let workerWithMessages = await worker.$jazz.ensureLoaded({
			resolve: { root: { chat: true } },
		})
		let rawMessages = workerWithMessages.root.chat?.messages
		if (!rawMessages)
			return c.json({ error: "put messages into your chat first" }, 400)
		let messages = JSON.parse(rawMessages) as TillyUIMessage[]
		let userContextMessages = addUserContextToMessages(messages)

		let usageLimits = await checkUsageLimits(user, worker)
		if (usageLimits.exceeded) {
			let errorMessage = "Usage budget exceeded"
			let errorResponse: UsageLimitExceededResponse = {
				error: errorMessage,
				code: "usage-limit-exceeded",
				limitExceeded: true,
				percentUsed: usageLimits.percentUsed,
				resetDate: usageLimits.resetDate
					? usageLimits.resetDate.toISOString()
					: null,
			}

			return c.json(errorResponse, 429)
		}

		let modelMessages = convertToModelMessages(userContextMessages, {
			ignoreIncompleteToolCalls: true,
			tools: clientTools,
		})

		if (!checkInputSize(user, modelMessages)) {
			return c.json({ error: "Request too large" }, 413)
		}

		let generationId = crypto.randomUUID()

		runBackgroundGeneration({
			user,
			worker,
			subscriptionStatus,
			modelMessages,
			generationId,
		}).catch((error: unknown) => {
			console.error("Background generation failed:", error)
		})

		return c.json({ generationId }, 202)
	})

function getCachedTokenCount(metadata: unknown): number {
	let providerMetadataSchema = z.object({
		google: z.object({
			usageMetadata: z.object({
				cachedContentTokenCount: z.number(),
			}),
		}),
	})
	let parsed = providerMetadataSchema.safeParse(metadata)
	if (!parsed.success) {
		return 0
	}
	return parsed.data.google.usageMetadata.cachedContentTokenCount
}

function makeStaticSystemPrompt() {
	return `You are Tilly, a friendly AI assistant for a personal relationship journal. You help the user remember the important moments and details about the people they care about.

You will find information about the user, locale, and time in the messages context.

Your personality: Concise, friendly, and helpful. Keep responses short but warm.

IMPORTANT: Default to responding in their configured UI language. If the user's recent message(s) are clearly in another language, detect that and match the user's language instead. When creating data (notes, reminders, person details), prefer the configured UI language unless the user explicitly requests otherwise.

When users share COMPLETED interactions or stories about people, you should:
1. FIRST check if there are any due reminders related to this person using listReminders
2. If there are due reminders that seem relevant to what the user is sharing, offer to mark them as completed
3. Create a note of the story (you can pin important details)
4. Suggest reminders for follow-ups

CONVERSATION vs NOTE CREATION:
- CREATE NOTES for: completed interactions ("I had coffee with...", "I saw John yesterday...", "Sarah called me...")
- DON'T CREATE NOTES for: planning ("I'm thinking about texting...", "Should I tell Sarah..."), questions about people ("What do you know about John?"), or hypothetical discussions
- When users ask for help with messages, communication advice, or want to discuss people, focus on helping rather than automatically creating notes
- Only create notes when users are clearly documenting something that already happened

NOTE SYSTEM: 
- Notes are flexible content that can be short facts ("Job: Manager at Google") or longer stories
- Notes support markdown formatting: **bold**, *italic*, [links](url), lists, etc.
- Pin important notes that should be prominently displayed
- Use pinning for key details like job, relationship status, important preferences, or significant life events
- IMPORTANT: When writing notes that are not short facts, write them in first person (ego perspective) as if the user is writing in their journal. For example: "I had coffee with Lisa today. She got promoted to manager and her daughter Emma just started kindergarten. She seemed stressed about the new responsibilities."

IMPORTANT: Always use getPersonDetails FIRST to find people by name. Be smart about disambiguation:
- If only one person actually matches the searched name, use them automatically
- When there are genuinely multiple people with similar names, use the userQuestion tool to ask for clarification with specific options
- Create new people if they don't exist
- COUPLES & FAMILIES: It's common and acceptable to have one person entry for people who are always seen together (like couples, families, or close friend groups). For example, "Sarah & Mike" or "The Johnson Family". When users mention these grouped people, use the existing combined entry rather than trying to separate them into individual entries.

USER INTERACTION: Use the userQuestion tool when you need clarification or confirmation to continue your work:
- For disambiguation: "I found 3 people named Anna. Which one do you mean?" with options showing their summaries
- For confirmation: "I found a reminder about calling mom. Should I mark it as done?" for yes/no questions
- For validation: "I see you already have a similar memory. Should I add this new one or update the existing one?"
- This tool provides clean, interactive UI for getting the information you need to help effectively

DUPLICATE PREVENTION: Before adding memories or reminders, ALWAYS check the person's existing data to avoid duplicates:
- Review existing memories to see if similar content already exists
- Check existing reminders to avoid creating duplicate follow-ups
- If you find similar content, either skip adding it or merge/update the existing entry instead
- When in doubt, use the userQuestion tool to ask if they want to add similar content or update existing content

PERSON SUMMARY/BIO: The summary field is like a bio that helps get the most important information about a person at a glance. It should include key details like relationship, profession, location, and personality traits.
- When you learn new important information about someone (job changes, relationship status, major life events), check if their current summary still accurately represents them
- If the summary seems outdated or incomplete based on the notes you've collected, proactively update it or ask the user for clarification to create a better summary
- For new people, if you don't have enough information to create a good summary, it's okay to ask the user for key details about them

Story Processing Example:
User: "Had coffee with Lisa. She got promoted to manager and her daughter Emma just started kindergarten. She seemed stressed about the new responsibilities."

Your actions:
1. getPersonDetails for Lisa
2. addNote: "I had coffee with Lisa today. She got promoted to manager and her daughter Emma just started kindergarten. She seemed stressed about the new responsibilities."
3. Consider pinning if this is a major life update: set pinned=true for important details
4. addReminder for Lisa: "Check how Lisa is settling into her new manager role"

Always confirm what you've saved: "I've captured your coffee story with Lisa and noted her promotion and Emma starting school. I'll remind you to check how she's adjusting to management."

Use tools to take action, don't just describe what should be done.`
}

function addUserContextToMessages(
	messages: TillyUIMessage[],
): TillyUIMessage[] {
	return messages.map(message => {
		if (message.role !== "user") return message

		let meta = message.metadata
		if (!meta) return message

		let context = buildUserContext(meta)
		if (!context) return message

		let contextPrefix = "<context>\n{"

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

		let content = (message as { content?: unknown }).content
		if (typeof content === "string") {
			if (content.startsWith(contextPrefix)) {
				return { ...message }
			}
			return { ...message, content: context + content }
		}

		return {
			...message,
			parts: [{ type: "text", text: context }],
		}
	})
}

function buildUserContext(meta: MessageMetadata): string | null {
	if (
		!meta.userName ||
		!meta.timezone ||
		!meta.locale ||
		typeof meta.timestamp !== "number"
	) {
		return null
	}

	let userLocalTime = toZonedTime(new Date(meta.timestamp), meta.timezone)
	let weekday = format(userLocalTime, "EEEE")
	let dateString = format(userLocalTime, "MMMM d, yyyy")
	let timeString = format(userLocalTime, "h:mm a")

	let contextPayload = {
		name: meta.userName,
		locale: meta.locale,
		timezone: meta.timezone,
		timestamp: meta.timestamp,
		localTime: {
			weekday,
			date: dateString,
			time: timeString,
		},
	}

	let payloadJson = JSON.stringify(contextPayload)

	return `<context>${payloadJson}</context>`
}

type UsageLimitExceededResponse = {
	error: string
	code: "usage-limit-exceeded"
	limitExceeded: true
	percentUsed: number
	resetDate: string | null
}

async function runBackgroundGeneration(params: {
	user: User
	worker: Awaited<ReturnType<typeof initUserWorker>>["worker"]
	subscriptionStatus: SubscriptionStatus
	modelMessages: ReturnType<typeof convertToModelMessages>
	generationId: string
}) {
	let { user, worker, subscriptionStatus, modelMessages, generationId } = params

	let chat = worker.root!.chat! // TODO: oh oh :(

	console.log(
		`[Chat] ${user.id} | Starting generation ${generationId} | Existing messages: ${chat.messages?.length ?? 0} chars`,
	)
	chat.$jazz.set("generationId", generationId)
	await worker.$jazz.waitForSync()
	console.log(
		`[Chat] ${user.id} | Generation state synced | generationId: ${generationId}`,
	)

	let abortController = new AbortController()

	let unsubscribe = chat.$jazz.subscribe((updatedChat: typeof chat) => {
		if (
			updatedChat.abortRequestedAt ||
			updatedChat.generationId !== generationId
		) {
			console.log(`[Chat] ${user.id} | Aborting generation ${generationId}`)
			abortController.abort()
		}
	})

	let currentMessages: TillyUIMessage[] = []

	try {
		let google = createGoogleGenerativeAI({ apiKey: GOOGLE_AI_API_KEY })

		let allTools = {
			...clientTools,
			...createServerTools(worker),
		}

		let initialMessagesJson = chat.messages ?? "[]"
		currentMessages = JSON.parse(initialMessagesJson) as TillyUIMessage[]
		console.log(
			`[Chat] ${user.id} | Initialized with ${currentMessages.length} messages`,
		)

		let handleChunk = createChunkHandler()

		let result = streamText({
			model: google("gemini-2.5-flash"),
			messages: modelMessages,
			system: makeStaticSystemPrompt(),
			tools: allTools,
			stopWhen: stepCountIs(100),
			abortSignal: abortController.signal,
			onChunk: async event => {
				currentMessages = handleChunk(event.chunk, currentMessages)

				let messagesJson = JSON.stringify(currentMessages)
				console.log(
					`[Chat] ${user.id} | Chunk received | Type: ${event.chunk.type} | Total messages: ${currentMessages.length} | JSON length: ${messagesJson.length}`,
				)
				chat.$jazz.set("messages", messagesJson)
			},
			onFinish: async finishResult => {
				console.log(
					`[Chat] ${user.id} | Generation ${generationId} | Finished | Final messages: ${currentMessages.length}`,
				)

				let inputTokens = finishResult.usage.inputTokens ?? 0
				let outputTokens = finishResult.usage.outputTokens ?? 0
				let cachedTokens = getCachedTokenCount(finishResult.providerMetadata)

				await updateUsage(user, worker, subscriptionStatus, {
					inputTokens,
					cachedTokens,
					outputTokens,
				})

				console.log(
					`[Chat] ${user.id} | Clearing generation state | generationId: ${generationId}`,
				)
				chat.$jazz.set("generationId", undefined)
				chat.$jazz.set("submittedAt", undefined)
				chat.$jazz.set("abortRequestedAt", undefined)

				await worker.$jazz.waitForAllCoValuesSync()
				console.log(`[Chat] ${user.id} | Generation complete | All data synced`)
			},
			onError: async error => {
				console.error(
					`[Chat] ${user.id} | Generation ${generationId} | Error:`,
					error,
				)
				chat.$jazz.set("generationId", undefined)
				chat.$jazz.set("submittedAt", undefined)
				chat.$jazz.set("abortRequestedAt", undefined)
			},
			onAbort: async () => {
				console.log(
					`[Chat] ${user.id} | Generation ${generationId} | Aborted by user`,
				)
				chat.$jazz.set("abortRequestedAt", undefined)
				chat.$jazz.set("generationId", undefined)
				chat.$jazz.set("submittedAt", undefined)
			},
		})

		console.log(`[Chat] ${user.id} | Consuming stream...`)
		await result.consumeStream()
		console.log(`[Chat] ${user.id} | Stream consumed`)
	} finally {
		unsubscribe()
	}
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function createChunkHandler() {
	let currentAssistantMessage: TillyUIMessage | null = null

	return function handleChunk(
		chunk: any,
		messages: TillyUIMessage[],
	): TillyUIMessage[] {
		let workingMessages = [...messages]

		if (chunk.type === "text-delta") {
			if (!currentAssistantMessage) {
				currentAssistantMessage = {
					id: nanoid(),
					role: "assistant",
					parts: [{ type: "text", text: chunk.text }],
				} as TillyUIMessage
				workingMessages.push(currentAssistantMessage)
				console.log(
					`[Chunk] Created new assistant message for text | ID: ${currentAssistantMessage.id}`,
				)
			} else {
				currentAssistantMessage.parts = [
					...(currentAssistantMessage.parts || []),
					{ type: "text", text: chunk.text },
				]
				console.log(
					`[Chunk] Added new text part | Parts count: ${currentAssistantMessage.parts.length}`,
				)
			}
		}

		if (chunk.type === "tool-call") {
			if (!currentAssistantMessage) {
				currentAssistantMessage = {
					id: nanoid(),
					role: "assistant",
					parts: [],
				} as TillyUIMessage
				workingMessages.push(currentAssistantMessage)
				console.log(
					`[Chunk] Created new assistant message | ID: ${currentAssistantMessage.id}`,
				)
			}

			currentAssistantMessage.parts = [
				...(currentAssistantMessage.parts || []),
				{
					type: `tool-${chunk.toolName}` as any,
					toolCallId: chunk.toolCallId,
					toolName: chunk.toolName,
					input: chunk.input,
					state: "input-available" as any,
				} as any,
			]
			console.log(
				`[Chunk] Added tool-call | Tool: ${chunk.toolName} | Parts count: ${currentAssistantMessage.parts.length}`,
			)
		}

		if (chunk.type === "tool-result") {
			if (!currentAssistantMessage) {
				currentAssistantMessage = {
					id: nanoid(),
					role: "assistant",
					parts: [],
				} as TillyUIMessage
				workingMessages.push(currentAssistantMessage)
				console.log(
					`[Chunk] Created new assistant message for tool-result | ID: ${currentAssistantMessage.id}`,
				)
			}

			let toolCallPart = currentAssistantMessage.parts?.find(
				p => "toolCallId" in p && p.toolCallId === chunk.toolCallId,
			)

			if (toolCallPart && "toolCallId" in toolCallPart) {
				;(toolCallPart as any).output = chunk.output
				;(toolCallPart as any).state = "output-available"
				console.log(
					`[Chunk] Updated tool-result | Tool: ${chunk.toolName} | CallID: ${chunk.toolCallId}`,
				)
			} else {
				currentAssistantMessage.parts = [
					...(currentAssistantMessage.parts || []),
					{
						type: `tool-${chunk.toolName}` as any,
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						input: chunk.input,
						output: chunk.output,
						state: "output-available" as any,
					} as any,
				]
				console.log(
					`[Chunk] Added new tool-result part | Tool: ${chunk.toolName} | Parts count: ${currentAssistantMessage.parts.length}`,
				)
			}
		}

		if (currentAssistantMessage) {
			console.log(
				`[Chunk] Returning messages | Total: ${workingMessages.length} | Assistant parts: ${currentAssistantMessage.parts?.length || 0}`,
			)
		}

		return workingMessages
	}
}
/* eslint-enable @typescript-eslint/no-explicit-any */
