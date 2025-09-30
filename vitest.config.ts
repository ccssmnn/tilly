import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		typecheck: {
			enabled: true,
			include: ["**/*.{test,spec}.{ts,tsx}"],
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
