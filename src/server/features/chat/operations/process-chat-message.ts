import { createGateway } from "@ai-sdk/gateway"
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
} from "ai"
import { AI_GATEWAY_API_KEY } from "astro:env/server"
import { z } from "zod"
import {
	clientTools,
	createServerTools,
	type TillyUIMessage,
} from "#shared/tools/tools"
import {
	checkInputSize,
	checkUsageLimits,
	updateUsage,
} from "#server/lib/chat-usage"
import {
	initUserWorker,
	getServerWorker,
	WorkerTimeoutError,
	type ServerWorker,
} from "#server/lib/utils"
import type { User } from "@clerk/backend"
import type { Loaded, ResolveQuery } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { makeStaticSystemPrompt } from "../lib/system-prompt"
import { addUserContextToMessage } from "../lib/user-context"
import { createChunkHandler } from "../lib/chunk-handler"
import { sendCompletionNotification } from "../lib/completion-notification"

export { processChatMessage }

let messagesQuery = {
	root: { assistant: { stringifiedMessages: true } },
} as const satisfies ResolveQuery<typeof UserAccount>

type ProcessChatResult =
	| { ok: false; error: string; code: string; status: 400 | 413 | 429 | 504 }
	| { ok: true; generate: () => Promise<void> }

async function processChatMessage(
	user: User,
	requestStartTime: number,
): Promise<ProcessChatResult> {
	let logger = (s: string) =>
		logStep(s, { requestStartTime, userId: user.id })

	let userWorkerResult: Awaited<ReturnType<typeof initUserWorker>>
	let serverWorker: ServerWorker
	try {
		userWorkerResult = await initUserWorker(user)
		serverWorker = await getServerWorker()
	} catch (error) {
		if (error instanceof WorkerTimeoutError) {
			return { ok: false, error: error.message, code: "worker-timeout", status: 504 }
		}
		throw error
	}

	let userWorker_ = userWorkerResult.worker

	let [
		userWorker,
		usageLimits,
	] = await Promise.all([
		userWorker_.$jazz.ensureLoaded({ resolve: messagesQuery }),
		checkUsageLimits(user, userWorker_, serverWorker),
	])

	if (usageLimits.exceeded) {
		let msg = "You've exceeded your usage limit."
		return { ok: false, error: msg, code: "usage-limit-exceeded", status: 429 }
	}

	logger("Messages loaded and usage limits checked")

	let messagesWithContext = userWorker.root.assistant?.stringifiedMessages
		.map((s: string) => JSON.parse(s) as TillyUIMessage)
		.map(msg => addUserContextToMessage(msg))

	if (!messagesWithContext || messagesWithContext.length === 0) {
		return { ok: false, error: "No messages to process", code: "empty-messages", status: 400 }
	}

	let modelMessages = await convertToModelMessages(messagesWithContext, {
		ignoreIncompleteToolCalls: true,
		tools: clientTools,
	})

	let { overflow } = checkInputSize(modelMessages)
	if (overflow !== 0) {
		let msg = `Messages size exceed limit by ${overflow}`
		return { ok: false, error: msg, code: "request-too-large", status: 413 }
	}

	return {
		ok: true,
		generate: () => generateAIResponse({ user, userWorker, modelMessages, requestStartTime }),
	}
}

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

async function generateAIResponse(params: {
	user: User
	userWorker: Loaded<typeof UserAccount, typeof messagesQuery>
	modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>
	requestStartTime: number
}) {
	let assistant = params.userWorker.root.assistant!

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
			model: gw("google/gemini-3-flash"),
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

				await sendCompletionNotification(
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
