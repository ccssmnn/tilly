import { useRef, useState } from "react"
import { Assistant } from "#shared/schema/user"
import { consumeUntil } from "../lib/consume-until"
import type { LoadedAssistantAccount } from "../lib/data"
import type { TillyUIMessage } from "#shared/tools/tools"

export { useChatMessaging }

function useChatMessaging(me: LoadedAssistantAccount) {
	let [isSending, setIsSending] = useState(false)
	let [failedToSend, setFailedToSend] = useState<Error | null>(null)
	let submitAbortControllerRef = useRef<AbortController | null>(null)

	async function sendMessage(message: TillyUIMessage, replaceIndex?: number) {
		setIsSending(true)
		setFailedToSend(null)

		let assistant
		if (me.root.assistant) {
			assistant = me.root.assistant
		} else {
			assistant = Assistant.create({
				version: 1,
				stringifiedMessages: [],
				submittedAt: new Date(),
			})
			me.root.$jazz.set("assistant", assistant)
		}

		if (!assistant.stringifiedMessages) {
			assistant.$jazz.set("stringifiedMessages", [JSON.stringify(message)])
			assistant.$jazz.set("submittedAt", new Date())
		} else if (replaceIndex !== undefined) {
			assistant.stringifiedMessages.$jazz.set(
				replaceIndex,
				JSON.stringify(message),
			)
			assistant.$jazz.set("submittedAt", new Date())
		} else {
			assistant.stringifiedMessages.$jazz.push(JSON.stringify(message))
			assistant.$jazz.set("submittedAt", new Date())
		}

		await me.$jazz.waitForAllCoValuesSync()

		let controller = new AbortController()
		submitAbortControllerRef.current = controller

		try {
			let response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: controller.signal,
			})
			if (!response.ok) throw new Error(await response.text())
			if (!response.body) throw new Error("No response body")
			await consumeUntil(response.body.getReader(), "generation-started")
		} catch (error) {
			assistant.$jazz.set("submittedAt", undefined)
			if ((error as Error).name === "AbortError") return
			setFailedToSend(error as Error)
		} finally {
			setIsSending(false)
			submitAbortControllerRef.current = null
		}
	}

	async function abort() {
		submitAbortControllerRef.current?.abort()
		me.root.assistant?.$jazz.set("abortRequestedAt", new Date())
		setIsSending(false)
	}

	return { isSending, failedToSend, sendMessage, abort }
}
