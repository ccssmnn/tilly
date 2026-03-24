import { createMiddleware } from "hono/factory"
import { authenticateRequest } from "jazz-tools"
import { getServerWorker, WorkerTimeoutError } from "#server/lib/utils"
import type { ServerWorker } from "#server/lib/utils"

export { requireServerWorker, requireJazzAuth }

type ServerWorkerContext = {
	Variables: {
		serverWorker: ServerWorker
	}
}

type JazzAuthContext = {
	Variables: {
		serverWorker: ServerWorker
		userId: string
	}
}

let requireServerWorker = createMiddleware<ServerWorkerContext>(
	async (c, next) => {
		try {
			let worker = await getServerWorker()
			c.set("serverWorker", worker)
			return next()
		} catch (error) {
			if (error instanceof WorkerTimeoutError) {
				return c.json(
					{ error: error.message, code: "worker-timeout" },
					504,
				)
			}
			throw error
		}
	},
)

let requireJazzAuth = createMiddleware<JazzAuthContext>(async (c, next) => {
	let serverWorker = c.get("serverWorker")
	let { account, error } = await authenticateRequest(c.req.raw, {
		loadAs: serverWorker,
	})

	if (error || !account) {
		return c.json(
			{ error: "Authentication required", code: "unauthorized" },
			401,
		)
	}

	c.set("userId", account.$jazz.id)
	return next()
})
