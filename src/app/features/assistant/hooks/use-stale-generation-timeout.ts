import { useEffect } from "react"
import type { co } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"

export { useStaleGenerationTimeout }

let GENERATION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

function useStaleGenerationTimeout(
	assistant: co.loaded<typeof Assistant> | undefined,
) {
	useEffect(() => {
		if (!assistant?.submittedAt) return

		let submittedTime = assistant.submittedAt.getTime()
		let now = Date.now()
		let age = now - submittedTime

		if (age >= GENERATION_TIMEOUT_MS) {
			resetGenerationMarkers(assistant)
			return
		}

		let remaining = GENERATION_TIMEOUT_MS - age
		let timer = setTimeout(() => {
			resetGenerationMarkers(assistant)
		}, remaining)

		return () => clearTimeout(timer)
	}, [assistant, assistant?.submittedAt])
}

async function resetGenerationMarkers(assistant: co.loaded<typeof Assistant>) {
	assistant.$jazz.set("submittedAt", undefined)
	assistant.$jazz.set("abortRequestedAt", undefined)
	await assistant.$jazz.waitForSync()
}
