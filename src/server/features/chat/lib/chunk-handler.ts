import { nanoid } from "nanoid"
import type { TextStreamPart } from "ai"
import type { TillyUIMessage, ToolSet } from "#shared/tools/tools"

export { createChunkHandler }

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
