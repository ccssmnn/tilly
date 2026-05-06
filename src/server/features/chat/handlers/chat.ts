import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { authMiddleware, requireAuth, requirePlus } from "#server/features/auth"
import { errorToStatus } from "#server/lib/errors"
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

		return result.match({
			ok: ({ generate }) =>
				streamSSE(c, async stream => {
					await stream.writeSSE({ data: "generation-started" })
					await generate()
					await stream.writeSSE({ data: "generation-finished" })
				}),
			err: e => c.json({ error: e.message, code: e._tag }, errorToStatus(e)),
		})
	})
