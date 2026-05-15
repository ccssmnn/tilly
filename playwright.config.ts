import { defineConfig, devices } from "@playwright/test"

let appUrl = "https://tilly.localhost"

export default defineConfig({
	testDir: "./e2e",
	timeout: 60_000,
	expect: {
		timeout: 10_000,
	},
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: appUrl,
		ignoreHTTPSErrors: true,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
})
