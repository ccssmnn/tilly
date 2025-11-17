import { type AuthObject, type User } from "@clerk/backend"
import { createMiddleware } from "hono/factory"

import { clerkClient } from "./auth-client"

type AuthAppContext = {
	Variables: {
		auth: AuthObject | null
		user: User | null
		requestStartTime: number
	}
}

type AuthenticatedAppContext = {
	Variables: {
		auth: Extract<AuthObject, { userId: string }>
		user: User
		requestStartTime: number
	}
}

export let authMiddleware = createMiddleware<AuthAppContext>(
	async (c, next) => {
		c.set("requestStartTime", performance.now())

		let result = await clerkClient.authenticateRequest(c.req.raw)
		let auth = result.toAuth()
		c.set("auth", auth)

		let clerkUserId = auth?.userId || null

		if (clerkUserId) {
			try {
				c.set("user", await clerkClient.users.getUser(clerkUserId))
			} catch (error) {
				console.warn("Failed to load Clerk user:", error)
			}
		}

		return await next()
	},
)

export let requireAuth = createMiddleware<AuthenticatedAppContext>(
	async (c, next) => {
		let auth = c.get("auth")
		let user = c.get("user")

		if (!auth?.userId || !user) {
			return c.json({ error: "Authentication required" }, 401)
		}

		return next()
	},
)
