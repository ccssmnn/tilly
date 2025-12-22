/* eslint-disable react-hooks/rules-of-hooks */
import { HttpApp, HttpRouter, HttpServerResponse } from "@effect/platform"
import { Effect, Option } from "effect"
import {
	authMiddleware,
	ClerkClientLive,
	CurrentUser,
	requireAuth,
} from "./lib/clerk-service"

export { createEffectHandler }

let publicRoutes = HttpRouter.empty.pipe(
	HttpRouter.get("/health", HttpServerResponse.json({ ok: true })),
)

let authenticatedRoutes = HttpRouter.empty.pipe(
	HttpRouter.get(
		"/me",
		Effect.gen(function* () {
			let userOpt = yield* CurrentUser
			let user = Option.getOrThrow(userOpt)
			return yield* HttpServerResponse.json({ userId: user.userId })
		}),
	),
	HttpRouter.use(requireAuth),
)

function createEffectHandler(options?: { prefix?: `/${string}` }) {
	let baseRouter = HttpRouter.empty.pipe(
		HttpRouter.mount("/", publicRoutes),
		HttpRouter.mount("/", authenticatedRoutes),
		HttpRouter.use(authMiddleware),
	)

	let router = options?.prefix
		? HttpRouter.prefixAll(baseRouter, options.prefix)
		: baseRouter

	let app = HttpApp.toWebHandlerLayer(router, ClerkClientLive)
	return app.handler
}
