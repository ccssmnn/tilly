import { HttpApp, HttpRouter, HttpServerResponse } from "@effect/platform"

let router = HttpRouter.empty.pipe(
	HttpRouter.get("/health", HttpServerResponse.json({ ok: true })),
	HttpRouter.prefixAll("/api/v1"),
)

export let effectHandler = HttpApp.toWebHandler(router)
