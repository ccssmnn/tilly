import { createGateway } from "@ai-sdk/gateway"
import { stepCountIs, streamText } from "ai"
import { AI_GATEWAY_API_KEY } from "astro:env/server"
import { clientTools, createServerTools } from "#shared/tools/tools"
import { checkInputSize, checkUsageLimits } from "#server/lib/chat-usage"
import { initUserWorker, getServerWorker } from "#server/lib/utils"
import {
	UsageLimitExceeded,
	InputTooLarge,
	type ServerError,
} from "#server/lib/errors"
import { Result } from "better-result"
import type { User } from "@clerk/backend"
import { initWorkerSafe } from "../lib/init-worker-safe"
import { loadModelMessages, messagesQuery } from "../lib/load-messages"
import { makeStaticSystemPrompt } from "../lib/system-prompt"
import { createChunkHandler } from "../lib/chunk-handler"
import { persistChunkUpdate } from "../lib/persist-chunk"
import { prepareAbortController } from "../lib/abort-controller"
import {
	resetAssistantState,
	clearAssistantState,
	setGenerationError,
} from "../lib/assistant-state"
import { recordUsage } from "../lib/record-usage"
import { sendCompletionNotification } from "../lib/completion-notification"
import { logStep } from "../lib/logger"
import type { WorkerTimeout, EmptyMessages } from "#server/lib/errors"

export { processChatMessage }
export type { ProcessError }

type ProcessError =
	| WorkerTimeout
	| UsageLimitExceeded
	| EmptyMessages
	| InputTooLarge
	| ServerError

async function processChatMessage(
	user: User,
	requestStartTime: number,
): Promise<Result<{ generate: () => Promise<void> }, ProcessError>> {
	let logger = (s: string) => logStep(s, { requestStartTime, userId: user.id })

	return Result.gen(async function* () {
		let { worker: userWorker } = yield* initWorkerSafe(() =>
			initUserWorker(user),
		)
		let serverWorker = yield* initWorkerSafe(getServerWorker)

		let [worker, usageLimitsResult] = await Promise.all([
			userWorker.$jazz.ensureLoaded({ resolve: messagesQuery }),
			checkUsageLimits(user, userWorker, serverWorker),
		])

		let usageLimits = yield* usageLimitsResult
		if (usageLimits.exceeded) {
			return Result.err(
				new UsageLimitExceeded({
					message: "You've exceeded your usage limit.",
				}),
			)
		}

		logger("Messages loaded and usage limits checked")

		let modelMessages = yield* loadModelMessages(worker)

		let { overflow } = checkInputSize(modelMessages)
		if (overflow !== 0) {
			return Result.err(
				new InputTooLarge({
					message: `Messages size exceed limit by ${overflow}`,
					overflow,
				}),
			)
		}

		return Result.ok({
			generate: async () => {
				let assistant = worker.root.assistant!
				let handleChunk = createChunkHandler()
				let { abortController, unsubscribe } = prepareAbortController(
					assistant,
					logger,
				)

				resetAssistantState(assistant)
				logger("Starting generation")

				try {
					let result = streamText({
						model: createGateway({ apiKey: AI_GATEWAY_API_KEY })(
							"google/gemini-3-flash",
						),
						messages: modelMessages,
						system: makeStaticSystemPrompt(),
						tools: { ...clientTools, ...createServerTools(worker) },
						stopWhen: stepCountIs(100),
						abortSignal: abortController.signal,
						onChunk: async event => {
							let update = handleChunk(event.chunk)
							if (update) persistChunkUpdate(assistant, update)
						},
						onFinish: async finishResult => {
							await recordUsage(user, worker, finishResult)
							await sendCompletionNotification(user, worker, logger)
							assistant.$jazz.set("submittedAt", undefined)
							assistant.$jazz.set("abortRequestedAt", undefined)
						},
						onError: async ({ error }) => {
							logger(`an error occured ${error}`)
							setGenerationError(assistant, error)
						},
						onAbort: async () => clearAssistantState(assistant),
					})

					await result.consumeStream()
					await worker.$jazz.waitForAllCoValuesSync()
				} finally {
					unsubscribe()
				}
			},
		})
	})
}
