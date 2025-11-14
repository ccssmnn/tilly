import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"
import { co } from "jazz-tools"

export { useChatHistory }

function useChatHistory() {
	let { me } = useAccount(UserAccount, {
		resolve: { root: { assistant: { messages: true } } },
	})

	function addMessage(message: TillyUIMessage) {
		if (!me) return
		if (!me.root) return
		if (!me.root.assistant) {
			me.root.$jazz.set("assistant", {
				version: 1,
				messages: co.plainText().create(JSON.stringify([message])),
			})
			return
		}
		if (!me.root.assistant.messages) {
			me.root.assistant.$jazz.set(
				"messages",
				co.plainText().create(JSON.stringify([message])),
			)
			return
		}

		let currentMessages: TillyUIMessage[] = JSON.parse(
			me.root.assistant.messages.toString(),
		)
		let updatedMessages = [...currentMessages, message]
		me.root.assistant.messages.$jazz.applyDiff(JSON.stringify(updatedMessages))
	}

	return { addMessage }
}
