import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { authMiddleware, requireAuth, requirePlus } from "#server/features/auth"
import { processChatMessage } from "../operations/process-chat-message"

export { chatMessagesApp }

let chatMessagesApp = new Hono()
	.use("*", authMiddleware)
	.use("*", requireAuth)
	.use("*", requirePlus)
	.post("/", async c => {
		let user = c.get("user")
		let requestStartTime = c.get("requestStartTime")

		let result = await processChatMessage(user, requestStartTime)

		if (!result.ok) {
			return c.json(
				{ error: result.error, code: result.code },
				result.status,
			)
		}

		return streamSSE(c, async stream => {
			await stream.writeSSE({ data: "generation-started" })
			await result.generate()
			await stream.writeSSE({ data: "generation-finished" })
		})
	})
