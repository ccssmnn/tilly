import { routes, type VercelConfig } from "@vercel/config/v1"

export let config: VercelConfig = {
	framework: "astro",
	installCommand: "bun install",
	buildCommand: "bun run build",
	bunVersion: "1.x",

	rewrites: [
		routes.rewrite("/app/(.*)", "/app/index.html"),
		routes.rewrite("/plausible/(.*)", "https://plausible.io/$1"),
		routes.rewrite("/api/event", "https://plausible.io/api/event"),
	],

	crons: [
		{
			path: "/api/push/deliver-notifications",
			schedule: "0 * * * *",
		},
	],
}
