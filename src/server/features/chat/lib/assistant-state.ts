import type { co } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"

export { resetAssistantState, clearAssistantState, setGenerationError }

function resetAssistantState(assistant: co.loaded<typeof Assistant>) {
	assistant.$jazz.set("submittedAt", new Date())
	assistant.$jazz.set("errorMessage", undefined)
}

function clearAssistantState(assistant: co.loaded<typeof Assistant>) {
	assistant.$jazz.set("errorMessage", undefined)
	assistant.$jazz.set("abortRequestedAt", undefined)
	assistant.$jazz.set("submittedAt", undefined)
}

function setGenerationError(
	assistant: co.loaded<typeof Assistant>,
	error: unknown,
) {
	let err = error as { name?: string; message?: string }
	if (err.name !== "AbortError") {
		assistant.$jazz.set("errorMessage", err.message || "Unknown error occurred")
	}
	assistant.$jazz.set("submittedAt", undefined)
	assistant.$jazz.set("abortRequestedAt", undefined)
}
