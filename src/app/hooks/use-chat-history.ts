import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"
import { co, z } from "jazz-tools"

export { useChatHistory }

function useChatHistory() {
	let me = useAccount(UserAccount, {
		resolve: { root: { assistant: { stringifiedMessages: { $each: true } } } },
		select: me =>
			me.$isLoaded
				? me
				: me.$jazz.loadingState === "loading"
					? undefined
					: null,
	})

	function addMessage(message: TillyUIMessage) {
		if (!me) return
		if (!me.root) return
		if (!me.root.assistant) {
			me.root.$jazz.set("assistant", {
				version: 1,
				stringifiedMessages: co
					.list(z.string())
					.create([JSON.stringify(message)]),
			})
			return
		}

		me.root.assistant.stringifiedMessages?.$jazz.push(JSON.stringify(message))
	}

	return { addMessage }
}
