import {
	createClerkClient,
	type ClerkClient as ClerkClientType,
} from "@clerk/backend"
import {
	HttpMiddleware,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform"
import { CLERK_SECRET_KEY } from "astro:env/server"
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "astro:env/client"
import { Context, Data, Effect, Layer, Option } from "effect"

export {
	ClerkClient,
	ClerkClientLive,
	CurrentAuth,
	CurrentUser,
	authMiddleware,
	requireAuth,
}
export type { CurrentUserData, ClerkAuthError }

type CurrentUserData = {
	userId: string
}

class ClerkAuthError extends Data.TaggedError("ClerkAuthError")<{
	reason: "authentication_failed" | "user_fetch_failed"
	cause?: unknown
}> {}

class ClerkClient extends Context.Tag("ClerkClient")<
	ClerkClient,
	ClerkClientType
>() {}

class CurrentAuth extends Context.Tag("CurrentAuth")<
	CurrentAuth,
	Option.Option<CurrentUserData>
>() {}

class CurrentUser extends Context.Tag("CurrentUser")<
	CurrentUser,
	CurrentUserData
>() {}

let ClerkClientLive = Layer.succeed(
	ClerkClient,
	createClerkClient({
		secretKey: CLERK_SECRET_KEY,
		publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY,
	}),
)

let authMiddleware = HttpMiddleware.make(app =>
	Effect.gen(function* () {
		let clerk = yield* ClerkClient
		let request = yield* HttpServerRequest.HttpServerRequest
		let rawRequest = request.source as Request

		let authResult = yield* Effect.tryPromise({
			try: () => clerk.authenticateRequest(rawRequest),
			catch: cause =>
				new ClerkAuthError({ reason: "authentication_failed", cause }),
		})

		let auth = authResult.toAuth()
		let currentAuth = auth?.userId
			? Option.some({ userId: auth.userId })
			: Option.none()

		return yield* Effect.provideService(app, CurrentAuth, currentAuth)
	}),
)

let requireAuth = HttpMiddleware.make(app =>
	Effect.gen(function* () {
		let auth = yield* CurrentAuth

		if (Option.isNone(auth)) {
			return yield* HttpServerResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			)
		}

		return yield* Effect.provideService(app, CurrentUser, auth.value)
	}),
)
