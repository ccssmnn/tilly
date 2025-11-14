import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { convertToModelMessages, stepCountIs, streamText } from "ai"
import { GOOGLE_AI_API_KEY } from "astro:env/server"
import { format, toZonedTime } from "date-fns-tz"
import { Hono } from "hono"

import {
	clientTools,
	createServerTools,
	type MessageMetadata,
	type TillyUIMessage,
} from "#shared/tools/tools"
import { z } from "zod"
import { authMiddleware, requireAuth } from "../lib/auth-middleware"
import { requirePlus } from "../lib/chat-subscription"
import {
	checkInputSize,
	checkUsageLimits,
	updateUsage,
} from "../lib/chat-usage"
import { initUserWorker } from "#server/lib/utils"

export { chatMessagesApp }

let chatMessagesApp = new Hono()
	.use("*", authMiddleware)
	.use("*", requireAuth)
	.use("*", requirePlus)
	.post("/", async c => {
		let { messages } = await c.req.json()

		if (!Array.isArray(messages)) {
			return c.json({ error: "Invalid messages payload" }, 400)
		}

		let userContextMessages = addUserContextToMessages(messages)

		let user = c.get("user")
		let subscriptionStatus = c.get("subscription")
		let { worker } = await initUserWorker(user)

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

		let google = createGoogleGenerativeAI({ apiKey: GOOGLE_AI_API_KEY })

		let allTools = {
			...clientTools,
			...createServerTools(worker),
		}

		let result = streamText({
			model: google("gemini-2.5-flash"),
			messages: modelMessages,
			system: makeStaticSystemPrompt(),
			tools: allTools,
			stopWhen: stepCountIs(100),
			onFinish: async ({ usage, providerMetadata }) => {
				let inputTokens = usage.inputTokens ?? 0
				let outputTokens = usage.outputTokens ?? 0
				let cachedTokens = getCachedTokenCount(providerMetadata)

				await updateUsage(user, worker, subscriptionStatus, {
					inputTokens,
					cachedTokens,
					outputTokens,
				})

				await worker.$jazz.waitForAllCoValuesSync()
			},
		})

		return result.toUIMessageStreamResponse()
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
