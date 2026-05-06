import type { TillyUIMessage } from "#shared/tools/tools"

export { createAddToolResult }

function createAddToolResult(
	messages: TillyUIMessage[],
	sendMessage: (msg: TillyUIMessage, idx?: number) => Promise<void>,
) {
	return async ({
		toolCallId,
		output,
	}: {
		toolCallId: string
		output: unknown
	}) => {
		let messageIndex = messages.findIndex(msg => {
			if (msg.role !== "assistant") return false
			return msg.parts?.some(
				p => "toolCallId" in p && p.toolCallId === toolCallId,
			)
		})

		if (messageIndex === -1) return

		let msg = messages[messageIndex]
		let updatedParts = msg.parts?.map(part => {
			if (!("toolCallId" in part)) return part
			if (part.toolCallId !== toolCallId) return part
			return { ...part, output, state: "output-available" as const }
		}) as TillyUIMessage["parts"]

		let updatedMessage: TillyUIMessage = { ...msg, parts: updatedParts }
		await sendMessage(updatedMessage, messageIndex)
	}
}
