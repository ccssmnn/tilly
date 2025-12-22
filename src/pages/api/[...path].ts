import type { APIRoute } from "astro"

import { Hono } from "hono"
import { app } from "../../server/main"
import { createEffectHandler } from "../../server/effect-app"

let effectHandler = createEffectHandler({ prefix: "/api/v1" })

export let ALL: APIRoute = c => {
	let url = new URL(c.request.url)

	if (url.pathname.startsWith("/api/v1")) {
		return effectHandler(c.request)
	}

	return new Hono().route("/api", app).fetch(c.request)
}
