import { updateUsage } from "#server/lib/chat-usage"

export { recordUsage }

async function recordUsage(
	user: { id: string; unsafeMetadata: Record<string, unknown> },
	worker: Parameters<typeof updateUsage>[1],
	finishResult: {
		usage: {
			inputTokens?: number
			outputTokens?: number
			cachedInputTokens?: number
		}
	},
) {
	let inputTokens = finishResult.usage.inputTokens ?? 0
	let cachedTokens = finishResult.usage.cachedInputTokens ?? 0
	let outputTokens = finishResult.usage.outputTokens ?? 0

	let result = await updateUsage(user, worker, {
		inputTokens,
		cachedTokens,
		outputTokens,
	})

	result.match({
		ok: () => {},
		err: e => console.error(`[Chat] Usage update failed: ${e.message}`),
	})
}
