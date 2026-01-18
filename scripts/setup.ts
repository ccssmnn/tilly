#!/usr/bin/env bun

import * as p from "@clack/prompts"
import { execSync } from "child_process"
import { existsSync, writeFileSync } from "fs"

export { main }

let ENV_FILE = ".env"

async function main() {
	p.intro("Tilly Development Setup")

	if (existsSync(ENV_FILE)) {
		let overwrite = await p.confirm({
			message: ".env already exists. Overwrite?",
			initialValue: false,
		})
		if (p.isCancel(overwrite) || !overwrite) {
			p.cancel("Setup cancelled")
			process.exit(0)
		}
	}

	p.log.step("Generating secrets...")

	let vapidKeys = generateVapidKeys()
	let cronSecret = generateRandomString(32)

	p.log.success("Generated VAPID keys and CRON_SECRET")

	p.log.step("Creating Jazz worker account...")

	let jazzWorker = createJazzWorkerAccount()

	p.log.success(`Created worker account: ${jazzWorker.accountId}`)

	p.log.step("Setting up Clerk...")

	p.log.info(`
To get Clerk credentials:
1. Go to https://clerk.com
2. Create account and new application
3. Go to API Keys in dashboard
4. Copy publishable key and secret key
`)

	let clerkPublishableKey = await p.text({
		message: "PUBLIC_CLERK_PUBLISHABLE_KEY",
		placeholder: "pk_test_...",
		validate: v => (!v ? "Required" : undefined),
	})
	if (p.isCancel(clerkPublishableKey)) return cancel()

	let clerkSecretKey = await p.text({
		message: "CLERK_SECRET_KEY",
		placeholder: "sk_test_...",
		validate: v => (!v ? "Required" : undefined),
	})
	if (p.isCancel(clerkSecretKey)) return cancel()

	let clerkAccountsUrl = await p.text({
		message: "PUBLIC_CLERK_ACCOUNTS_URL (user management URL, optional)",
		placeholder: "https://accounts.your-app.clerk.dev",
		initialValue: "",
	})
	if (p.isCancel(clerkAccountsUrl)) return cancel()

	p.log.step("Setting up Google AI...")

	p.log.info(`
To get Google Gemini API key:
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy the key
`)

	let googleAiKey = await p.text({
		message: "GOOGLE_AI_API_KEY",
		placeholder: "AIza...",
		validate: v => (!v ? "Required" : undefined),
	})
	if (p.isCancel(googleAiKey)) return cancel()

	p.log.step("Optional settings...")

	let weeklyBudget = await p.text({
		message: "WEEKLY_BUDGET (in dollars, for AI usage limits)",
		placeholder: "1.00",
		initialValue: "1.00",
	})
	if (p.isCancel(weeklyBudget)) return cancel()

	let envContent = `GOOGLE_AI_API_KEY=${googleAiKey}
CLERK_SECRET_KEY=${clerkSecretKey}
PUBLIC_CLERK_PUBLISHABLE_KEY=${clerkPublishableKey}
PUBLIC_CLERK_ACCOUNTS_URL=${clerkAccountsUrl || ""}
PUBLIC_JAZZ_SYNC_SERVER=ws://localhost:4200
PUBLIC_VAPID_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
CRON_SECRET=${cronSecret}

PUBLIC_JAZZ_WORKER_ACCOUNT=${jazzWorker.accountId}
JAZZ_WORKER_SECRET=${jazzWorker.accountSecret}

WEEKLY_BUDGET=${weeklyBudget}
PUBLIC_ENABLE_PAYWALL=false

INPUT_TOKEN_COST_PER_MILLION=0.10
CACHED_INPUT_TOKEN_COST_PER_MILLION=0.025
OUTPUT_TOKEN_COST_PER_MILLION=0.40
MAX_REQUEST_TOKENS=32000
PUBLIC_PLAUSIBLE_DOMAIN=
`

	writeFileSync(ENV_FILE, envContent)

	p.log.success(".env file created")

	p.outro(`Setup complete!

To start developing:
  1. Run 'bunx jazz-run sync' in one terminal (local sync server)
  2. Run 'bun dev' in another terminal`)
}

function generateVapidKeys(): { publicKey: string; privateKey: string } {
	try {
		let output = execSync("bun x web-push generate-vapid-keys --json", {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		})
		return JSON.parse(output.trim())
	} catch {
		p.log.error("Failed to generate VAPID keys.")
		process.exit(1)
	}
}

type JazzWorkerCredentials = { accountId: string; accountSecret: string }

function createJazzWorkerAccount(): JazzWorkerCredentials {
	try {
		let output = execSync(
			'bun x jazz-run account create --name "Tilly Worker" --peer ws://localhost:4200 --json',
			{ encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
		)
		let parsed = JSON.parse(output.trim())
		return { accountId: parsed.accountId, accountSecret: parsed.accountSecret }
	} catch {
		p.log.error("Failed to create Jazz worker account.")
		p.log.info(
			"Make sure local Jazz sync server is running: bunx jazz-run sync",
		)
		process.exit(1)
	}
}

function generateRandomString(length: number): string {
	let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	let result = ""
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)]
	}
	return result
}

function cancel(): never {
	p.cancel("Setup cancelled")
	process.exit(0)
}

main().catch(err => {
	p.log.error(err.message)
	process.exit(1)
})
