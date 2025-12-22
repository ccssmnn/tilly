import type { APIRoute } from "astro"

import { Hono } from "hono"
import { app } from "../../server/main"
import { effectHandler } from "../../server/effect-app"

export let ALL: APIRoute = c => {
	let url = new URL(c.request.url)

	if (url.pathname.startsWith("/api/v1")) {
		return effectHandler(c.request)
	}

	return new Hono().route("/api", app).fetch(c.request)
}
