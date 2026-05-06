import type { co } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"

export { persistChunkUpdate }

type LoadedAssistant = co.loaded<
	typeof Assistant,
	{ stringifiedMessages: true }
>

type ChunkUpdate = {
	message: TillyUIMessage
	insertMode: "append" | "replace"
}

function persistChunkUpdate(assistant: LoadedAssistant, update: ChunkUpdate) {
	if (update.insertMode === "append") {
		assistant.stringifiedMessages.$jazz.push(JSON.stringify(update.message))
	}
	if (update.insertMode === "replace") {
		assistant.stringifiedMessages.$jazz.set(
			assistant.stringifiedMessages.length - 1,
			JSON.stringify(update.message),
		)
	}
}
