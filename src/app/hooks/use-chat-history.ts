import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"

export { useChatHistory }

function useChatHistory() {
	let { me } = useAccount(UserAccount, {
		resolve: { root: { chat: true } },
	})

	function addMessage(message: TillyUIMessage) {
		if (!me?.root?.chat) return

		let currentMessages: TillyUIMessage[] = []
		try {
			currentMessages = JSON.parse(me.root.chat.messages)
		} catch (error) {
			console.error("Failed to parse chat messages", error)
		}

		let updatedMessages = [...currentMessages, message]
		me.root.chat.$jazz.set("messages", JSON.stringify(updatedMessages))
	}

	return { addMessage }
}
