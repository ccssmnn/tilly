// @ts-check
import { defineConfig, envField } from "astro/config"
import react from "@astrojs/react"
import pwa from "@vite-pwa/astro"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

import vercel from "@astrojs/vercel"
import node from "@astrojs/node"

let useNodeAdapter = process.env.ASTRO_ADAPTER === "node"
let runtimeAdapter = useNodeAdapter ? node({ mode: "standalone" }) : vercel()

export default defineConfig({
	output: "server",
	adapter: runtimeAdapter,

	devToolbar: { enabled: false },
	integrations: [
		react({ babel: { plugins: ["babel-plugin-react-compiler"] } }),
		pwa({
			registerType: "prompt",
			scope: "/app/",
			strategies: "injectManifest",
			injectRegister: false,
			srcDir: "src/app",
			filename: "sw.ts",
			manifest: false,
			injectManifest: {
				globPatterns: [
					"_astro/**/*",
					"app/**/*.{css,html,ico,js,json,png,svg,txt,webp,woff2}",
				],
				globIgnores: ["**/images/**", "**/videos/**"],
			},
		}),
	],

	i18n: {
		locales: ["en", "de"],
		defaultLocale: "en",
		routing: {
			prefixDefaultLocale: false,
		},
	},

	env: {
		schema: {
			GOOGLE_AI_API_KEY: envField.string({
				context: "server",
				access: "secret",
			}),
			CLERK_SECRET_KEY: envField.string({
				context: "server",
				access: "secret",
			}),
			PUBLIC_CLERK_PUBLISHABLE_KEY: envField.string({
				context: "client",
				access: "public",
			}),
			PUBLIC_JAZZ_SYNC_SERVER: envField.string({
				context: "client",
				access: "public",
			}),
			PUBLIC_VAPID_KEY: envField.string({
				context: "client",
				access: "public",
			}),
			VAPID_PRIVATE_KEY: envField.string({
				context: "server",
				access: "secret",
			}),
			CRON_SECRET: envField.string({
				context: "server",
				access: "secret",
			}),
			PUBLIC_JAZZ_WORKER_ACCOUNT: envField.string({
				context: "client",
				access: "public",
			}),
			JAZZ_WORKER_SECRET: envField.string({
				context: "server",
				access: "secret",
			}),
			PUBLIC_ENABLE_PAYWALL: envField.boolean({
				context: "client",
				access: "public",
			}),
			WEEKLY_BUDGET: envField.number({
				context: "server",
				access: "secret",
			}),
			INPUT_TOKEN_COST_PER_MILLION: envField.number({
				context: "server",
				access: "secret",
			}),
			CACHED_INPUT_TOKEN_COST_PER_MILLION: envField.number({
				context: "server",
				access: "secret",
			}),
			OUTPUT_TOKEN_COST_PER_MILLION: envField.number({
				context: "server",
				access: "secret",
			}),
			MAX_REQUEST_TOKENS: envField.number({
				context: "server",
				access: "secret",
			}),
			PUBLIC_PLAUSIBLE_DOMAIN: envField.string({
				context: "client",
				access: "public",
				optional: true,
			}),
		},
	},
	vite: {
		plugins: [
			// @ts-expect-error TODO: :(:(
			tanstackRouter({
				target: "react",
				routesDirectory: "./src/app/routes",
				generatedRouteTree: "./src/app/routeTree.gen.ts",
			}),
			// @ts-expect-error TODO: :(:(
			tailwindcss(),
		],
	},
})
