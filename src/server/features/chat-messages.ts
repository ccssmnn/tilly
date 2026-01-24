import { createGateway } from "@ai-sdk/gateway"
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type TextStreamPart,
} from "ai"
import { AI_GATEWAY_API_KEY } from "astro:env/server"
import { format, toZonedTime } from "date-fns-tz"
import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { nanoid } from "nanoid"
import {
	clientTools,
	createServerTools,
	type MessageMetadata,
	type TillyUIMessage,
	type ToolSet,
} from "#shared/tools/tools"
import { z } from "zod"
import { authMiddleware, requireAuth } from "../lib/auth-middleware"
import { requirePlus } from "../lib/chat-subscription"
import {
	checkInputSize,
	checkUsageLimits,
	updateUsage,
} from "../lib/chat-usage"
import { initUserWorker, initServerWorker } from "#server/lib/utils"
import type { User } from "@clerk/backend"
import { co, type Loaded, type ResolveQuery } from "jazz-tools"
import { UserAccount, Assistant } from "#shared/schema/user"
import {
	getEnabledDevices,
	getIntl,
	sendNotificationToDevice,
	settingsQuery,
} from "./push-shared"
import type { NotificationPayload } from "./push-shared"

export { chatMessagesApp }

let chatMessagesApp = new Hono()
	.use("*", authMiddleware)
	.use("*", requireAuth)
	.use("*", requirePlus)
	.post("/", async c => {
		let user = c.get("user")
		let requestStartTime = c.get("requestStartTime")
		let logger = (s: string) =>
			logStep(s, { requestStartTime, userId: user.id })

		let [
			{ worker: userWorker_ },
			{ worker: serverWorker }, //
		] = await Promise.all([
			initUserWorker(user),
			initServerWorker(), //
		])

		logger("Workers initialized")

		let [
			userWorker,
			usageLimits, //
		] = await Promise.all([
			userWorker_.$jazz.ensureLoaded({ resolve: messagesQuery }),
			checkUsageLimits(user, userWorker_, serverWorker),
		])

		if (usageLimits.exceeded) {
			let msg = "You've exceeded your usage limit."
			return c.json({ code: "usage-limit-exceeded", error: msg }, 429)
		}

		logger("Messages loaded and usage limits checked")

		let messagesWithContext = userWorker.root.assistant?.stringifiedMessages
			.map((s: string) => JSON.parse(s) as TillyUIMessage)
			.map(msg => addUserContextToMessage(msg))

		if (!messagesWithContext || messagesWithContext.length === 0) {
			return c.json(
				{ error: "No messages to process", code: "empty-messages" },
				400,
			)
		}

		let modelMessages = convertToModelMessages(messagesWithContext, {
			ignoreIncompleteToolCalls: true,
			tools: clientTools,
		})

		let { overflow } = checkInputSize(modelMessages)
		if (overflow !== 0) {
			let msg = `Messages size exceed limit by ${overflow}`
			logger(msg)
			return c.json({ error: msg, code: "request-too-large" }, 413)
		}

		logger("Alright. Starting streaming generation.")
		return streamSSE(c, async stream => {
			// we need to tell the client we are starting now
			// so they know that until now everything was correct
			await stream.writeSSE({ data: "generation-started" })

			// the ai response will be synced to the client via jazz
			await generateAIResponse({
				user,
				userWorker,
				modelMessages,
				requestStartTime,
			})

			// keep the stream alive until we're done generating so
			// our server function won't get killed
			await stream.writeSSE({ data: "generation-finished" })
		})
	})

function getCachedTokenCount(metadata: unknown): number {
	let providerMetadataSchema = z.object({
		google: z.object({
			usageMetadata: z.object({ cachedContentTokenCount: z.number() }),
		}),
	})
	let parsed = providerMetadataSchema.safeParse(metadata)
	if (!parsed.success) return 0
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

Use tools to take action, don't just describe what should be done.

SHARING: Users can share people with collaborators via invite links from the person's detail page. You cannot create invite links—direct users to the share button in the UI.`
}

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

let messagesQuery = {
	root: { assistant: { stringifiedMessages: true } },
} as const satisfies ResolveQuery<typeof UserAccount>

async function generateAIResponse(params: {
	user: User
	userWorker: Loaded<typeof UserAccount, typeof messagesQuery>
	modelMessages: ReturnType<typeof convertToModelMessages>
	requestStartTime: number
}) {
	let assistant = params.userWorker.root.assistant! // TODO: mhm, i don't like this assertion

	let logger = (s: string) => {
		logStep(s, {
			requestStartTime: params.requestStartTime,
			userId: params.user.id,
		})
	}
	let abortController = new AbortController()

	let unsubscribe = assistant.$jazz.subscribe(({ abortRequestedAt }) => {
		if (!abortRequestedAt) return
		logger(`Jazz abort requested at ${abortRequestedAt}`)
		abortController.abort()
	})

	abortController.signal.addEventListener("abort", () => {
		logger("AbortController signal aborted")
	})

	assistant.$jazz.set("submittedAt", new Date())
	assistant.$jazz.set("errorMessage", undefined)

	logger("Starting generation")

	try {
		let allTools = {
			...clientTools,
			...createServerTools(params.userWorker),
		}

		let handleChunk = createChunkHandler()

		logger(
			`About to call streamText, abortController.signal.aborted: ${abortController.signal.aborted}`,
		)

		let gw = createGateway({ apiKey: AI_GATEWAY_API_KEY })

		let result = streamText({
			model: gw("google/gemini-2.5-flash"),
			messages: params.modelMessages,
			system: makeStaticSystemPrompt(),
			tools: allTools,
			stopWhen: stepCountIs(100),
			abortSignal: abortController.signal,
			onChunk: async event => {
				let result = handleChunk(event.chunk)
				if (result?.insertMode === "append") {
					assistant.stringifiedMessages.$jazz.push(
						JSON.stringify(result.message),
					)
				}
				if (result?.insertMode === "replace") {
					assistant.stringifiedMessages.$jazz.set(
						assistant.stringifiedMessages.length - 1,
						JSON.stringify(result.message),
					)
				}
			},
			onFinish: async finishResult => {
				await updateUsage(params.user, params.userWorker, {
					inputTokens: finishResult.usage.inputTokens ?? 0,
					cachedTokens: getCachedTokenCount(finishResult.providerMetadata),
					outputTokens: finishResult.usage.outputTokens ?? 0,
				})

				await sendAssistantCompletionNotification(
					params.user,
					params.userWorker,
					logger,
				)

				assistant.$jazz.set("submittedAt", undefined)
				assistant.$jazz.set("abortRequestedAt", undefined)
			},
			onError: async ({ error }) => {
				logger(`an error occured ${error}`)

				let err = error as { name?: string; message?: string }
				let isAbort = err.name === "AbortError"

				if (!isAbort) {
					let errorMessage = err.message || "Unknown error occurred"
					assistant.$jazz.set("errorMessage", errorMessage)
				}

				assistant.$jazz.set("submittedAt", undefined)
				assistant.$jazz.set("abortRequestedAt", undefined)
			},
			onAbort: async () => {
				assistant.$jazz.set("errorMessage", undefined)
				assistant.$jazz.set("abortRequestedAt", undefined)
				assistant.$jazz.set("submittedAt", undefined)
			},
		})

		await result.consumeStream()
		await params.userWorker.$jazz.waitForAllCoValuesSync()
	} finally {
		unsubscribe()
	}
}

type ChunkTypesToIgnore =
	| "source"
	| "reasoning-delta"
	| "tool-input-start"
	| "tool-input-delta"
	| "raw"

function createChunkHandler() {
	let currentAssistantMessage: TillyUIMessage | null = null

	return function handleChunk(
		chunk: Extract<
			TextStreamPart<ToolSet>,
			{ type: "text-delta" | "tool-call" | "tool-result" | ChunkTypesToIgnore }
		>,
	): { message: TillyUIMessage; insertMode: "append" | "replace" } | null {
		if (chunk.type === "raw") return null
		if (chunk.type === "tool-input-start") return null
		if (chunk.type === "tool-input-delta") return null
		if (chunk.type === "reasoning-delta") return null
		if (chunk.type === "source") return null

		let insertMode: "append" | "replace" = "replace"

		if (chunk.type === "text-delta") {
			if (!currentAssistantMessage) {
				currentAssistantMessage = {
					id: nanoid(),
					role: "assistant",
					parts: [{ type: "text", text: chunk.text }],
				}
				insertMode = "append"
				return { message: currentAssistantMessage, insertMode }
			}

			let parts = currentAssistantMessage.parts || []
			let lastPart = parts.at(-1)

			currentAssistantMessage.parts =
				lastPart?.type === "text"
					? [
							...parts.slice(0, -1),
							{ type: "text", text: lastPart.text + chunk.text },
						]
					: [...parts, { type: "text", text: chunk.text }]

			insertMode = "replace"
			return { message: currentAssistantMessage, insertMode }
		}

		if (chunk.type === "tool-call") {
			if (!currentAssistantMessage) {
				currentAssistantMessage = { id: nanoid(), role: "assistant", parts: [] }
				insertMode = "append"
			} else {
				insertMode = "replace"
			}

			currentAssistantMessage.parts = [
				...(currentAssistantMessage.parts || []),
				{
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					type: `tool-${chunk.toolName}` as any,
					toolCallId: chunk.toolCallId,
					toolName: chunk.toolName,
					input: chunk.input,
					state: "input-available",
				},
			]

			return { message: currentAssistantMessage, insertMode }
		}

		if (chunk.type === "tool-result") {
			if (!currentAssistantMessage) {
				currentAssistantMessage = { id: nanoid(), role: "assistant", parts: [] }
				insertMode = "append"
			} else {
				insertMode = "replace"
			}

			let parts = currentAssistantMessage.parts || []
			let toolCallPartIndex = parts.findIndex(
				p => "toolCallId" in p && p.toolCallId === chunk.toolCallId,
			)

			if (toolCallPartIndex !== -1) {
				currentAssistantMessage.parts = parts.map((part, idx) => {
					if (idx !== toolCallPartIndex) return part
					if (!("toolCallId" in part)) return part
					return {
						...part,
						output: chunk.output,
						state: "output-available",
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} as any
				})
			} else {
				currentAssistantMessage.parts = [
					...parts,
					{
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						type: `tool-${chunk.toolName}` as any,
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						input: chunk.input,
						output: chunk.output,
						state: "output-available",
					},
				]
			}

			return { message: currentAssistantMessage, insertMode }
		}

		chunk satisfies never
		return null
	}
}

async function sendAssistantCompletionNotification(
	user: User,
	worker: Loaded<
		typeof UserAccount,
		{ root: { assistant: { stringifiedMessages: true } } }
	>,
	logger: (step: string) => void,
) {
	try {
		let chat = worker.root.assistant
		if (!chat) {
			logger("No assistant chat, skipping notification")
			return
		}

		if (chat.notifyOnComplete === false) {
			logger("User disabled completion notifications, skipping")
			return
		}

		let acknowledged = await waitForAcknowledgment(chat, 3000)

		chat.$jazz.set("notificationCheckId", undefined)
		chat.$jazz.set("notificationAcknowledgedId", undefined)

		if (acknowledged) {
			logger("Client acknowledged presence, skipping notification")
			return
		}

		let workerWithSettings = await worker.$jazz.ensureLoaded({
			resolve: settingsQuery,
		})

		let notificationSettings = workerWithSettings.root.notificationSettings
		if (!notificationSettings) {
			logger("No notification settings, skipping notification")
			return
		}

		let devices = getEnabledDevices(notificationSettings)
		if (devices.length === 0) {
			logger("No enabled devices, skipping notification")
			return
		}

		let t = getIntl(workerWithSettings)
		let payload: NotificationPayload = {
			title: t("server.push.assistantComplete.title"),
			body: t("server.push.assistantComplete.body"),
			icon: "/favicon.ico",
			badge: "/favicon.ico",
			url: "/app/assistant",
			userId: user.id,
		}

		logger(`Sending completion notification to ${devices.length} devices`)

		let results = await Promise.allSettled(
			devices.map(device => sendNotificationToDevice(device, payload)),
		)

		let successCount = results.filter(
			r => r.status === "fulfilled" && r.value.ok,
		).length
		logger(
			`Completion notification sent to ${successCount}/${devices.length} devices`,
		)
	} catch (error) {
		console.error(
			`[Chat] ${user.id} | Failed to send completion notification:`,
			error,
		)
	}
}

async function waitForAcknowledgment(
	chat: co.loaded<typeof Assistant>,
	timeoutMs: number,
): Promise<boolean> {
	let checkId = nanoid()
	chat.$jazz.set("notificationCheckId", checkId)

	await chat.$jazz.waitForSync()

	return new Promise(resolve => {
		let timer = setTimeout(() => {
			unsubscribe()
			resolve(false)
		}, timeoutMs)

		let unsubscribe = chat.$jazz.subscribe(
			(updatedChat: co.loaded<typeof Assistant>) => {
				if (updatedChat.notificationAcknowledgedId === checkId) {
					clearTimeout(timer)
					unsubscribe()
					resolve(true)
				}
			},
		)
	})
}

function getElapsed(startTime: number): number {
	return Math.round(performance.now() - startTime)
}

function logStep(
	step: string,
	options: { requestStartTime: number; userId: string },
) {
	let elapsed = getElapsed(options.requestStartTime)
	let timeStr = elapsed > 500 ? `\x1b[31m+${elapsed}ms\x1b[0m` : `+${elapsed}ms`
	let prefix = `[Chat] ${options.userId} | ${timeStr}`
	if (elapsed > 500) {
		console.warn(`${prefix} | ${step}`)
	} else {
		console.log(`${prefix} | ${step}`)
	}
}
