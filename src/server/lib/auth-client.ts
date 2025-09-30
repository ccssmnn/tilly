import { createClerkClient } from "@clerk/backend"
import { CLERK_SECRET_KEY } from "astro:env/server"
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "astro:env/client"

let clerkClient = createClerkClient({
	secretKey: CLERK_SECRET_KEY,
	publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY,
})

export { clerkClient }
