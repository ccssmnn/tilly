import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"

export { useChatHistory }

function useChatHistory() {
	let { me } = useAccount(UserAccount, {
		resolve: { root: { assistant: true } },
	})

	function addMessage(message: TillyUIMessage) {
		if (!me) return
		if (!me.root) return
		if (!me.root.assistant) {
			me.root.$jazz.set("assistant", {
				version: 1,
				stringifiedMessages: JSON.stringify([message]),
			})
			return
		}

		let currentMessages: TillyUIMessage[] = JSON.parse(
			me.root.assistant.stringifiedMessages,
		)
		let updatedMessages = [...currentMessages, message]
		me.root.assistant.$jazz.set(
			"stringifiedMessages",
			JSON.stringify(updatedMessages),
		)
	}

	return { addMessage }
}
