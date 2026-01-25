import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	plugins: [react()] as any,
	test: {
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		exclude: ["**/node_modules/**", "**/.reference/**"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		fileParallelism: false,
		typecheck: {
			enabled: true,
			include: ["src/**/*.{test,spec}.{ts,tsx}"],
			tsconfig: "./tsconfig.vitest.json",
		},
	},
	resolve: {
		alias: {
			"#app": new URL("./src/app", import.meta.url).pathname,
			"#server": new URL("./src/server", import.meta.url).pathname,
			"#shared": new URL("./src/shared", import.meta.url).pathname,
			"#www": new URL("./src/www", import.meta.url).pathname,
		},
	},
})
