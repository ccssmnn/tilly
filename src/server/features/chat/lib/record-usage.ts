import { z } from "zod"
import { updateUsage } from "#server/lib/chat-usage"

export { recordUsage }

let providerMetadataSchema = z.object({
	google: z.object({
		usageMetadata: z.object({ cachedContentTokenCount: z.number() }),
	}),
})

async function recordUsage(
	user: { id: string; unsafeMetadata: Record<string, unknown> },
	worker: Parameters<typeof updateUsage>[1],
	finishResult: {
		usage: { inputTokens?: number; outputTokens?: number }
		providerMetadata: unknown
	},
) {
	let parsed = providerMetadataSchema.safeParse(finishResult.providerMetadata)
	let cachedTokens = parsed.success
		? parsed.data.google.usageMetadata.cachedContentTokenCount
		: 0

	let result = await updateUsage(user, worker, {
		inputTokens: finishResult.usage.inputTokens ?? 0,
		cachedTokens,
		outputTokens: finishResult.usage.outputTokens ?? 0,
	})

	result.match({
		ok: () => {},
		err: e => console.error(`[Chat] Usage update failed: ${e.message}`),
	})
}
