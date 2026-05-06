import type { co } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"

export { prepareAbortController }

function prepareAbortController(
	assistant: co.loaded<typeof Assistant>,
	logger: (s: string) => void,
) {
	let abortController = new AbortController()

	let unsubscribe = assistant.$jazz.subscribe(
		({ abortRequestedAt }: co.loaded<typeof Assistant>) => {
			if (!abortRequestedAt) return
			logger(`Jazz abort requested at ${abortRequestedAt}`)
			abortController.abort()
		},
	)

	abortController.signal.addEventListener("abort", () => {
		logger("AbortController signal aborted")
	})

	return { abortController, unsubscribe }
}
