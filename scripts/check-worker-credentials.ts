#!/usr/bin/env tsx

import { startWorker } from "jazz-tools/worker"
import { ServerAccount } from "../src/shared/schema/server"

type CliArgs = {
	syncServer: string
	accountId: string
	accountSecret: string
	timeoutMs: number
}

async function main() {
	if (process.argv.includes("--help") || process.argv.includes("-h")) {
		printUsage()
		process.exit(0)
	}

	let args = parseArgs(process.argv.slice(2))
	if (!args) {
		printUsage()
		process.exit(1)
	}

	console.log("Checking Jazz worker credentials...")
	console.log(`- sync server: ${args.syncServer}`)
	console.log(`- expected account: ${args.accountId}`)

	let timeout = new Promise<never>((_, reject) => {
		setTimeout(
			() => reject(new Error(`Timed out after ${args.timeoutMs}ms`)),
			args.timeoutMs,
		)
	})

	let workerPromise = startWorker({
		AccountSchema: ServerAccount,
		syncServer: args.syncServer,
		accountID: args.accountId,
		accountSecret: args.accountSecret,
		skipInboxLoad: true,
		asActiveAccount: false,
	})

	let workerResult = await Promise.race([workerPromise, timeout])
	let actualAccountId = workerResult.worker.$jazz.id

	console.log(`- loaded account: ${actualAccountId}`)

	if (actualAccountId !== args.accountId) {
		console.error("\nFAIL: secret authenticated a different account")
		console.error(`expected: ${args.accountId}`)
		console.error(`actual:   ${actualAccountId}`)
		await workerResult.shutdownWorker?.()
		process.exit(2)
	}

	await workerResult.shutdownWorker?.()
	console.log("\nOK: worker account + secret match")
}

function parseArgs(argv: string[]): CliArgs | null {
	let syncServer =
		readFlag(argv, "--sync-server") || process.env.PUBLIC_JAZZ_SYNC_SERVER
	let accountId =
		readFlag(argv, "--account-id") || process.env.PUBLIC_JAZZ_WORKER_ACCOUNT
	let accountSecret =
		readFlag(argv, "--account-secret") || process.env.JAZZ_WORKER_SECRET
	let timeoutRaw = readFlag(argv, "--timeout-ms")
	let timeoutMs = timeoutRaw ? Number(timeoutRaw) : 30_000

	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
		console.error("Invalid --timeout-ms value")
		return null
	}

	if (!syncServer || !accountId || !accountSecret) {
		console.error("Missing required inputs")
		return null
	}

	return {
		syncServer,
		accountId,
		accountSecret,
		timeoutMs,
	}
}

function readFlag(argv: string[], key: string): string | undefined {
	let index = argv.indexOf(key)
	if (index === -1) return undefined
	let value = argv[index + 1]
	if (!value || value.startsWith("--")) return undefined
	return value
}

function printUsage() {
	console.log(`
Usage:
  tsx scripts/check-worker-credentials.ts \\
    --sync-server <ws://...> \\
    --account-id <co_...> \\
    --account-secret <sealerSecret_.../signerSecret_...>

Or use env vars:
  PUBLIC_JAZZ_SYNC_SERVER
  PUBLIC_JAZZ_WORKER_ACCOUNT
  JAZZ_WORKER_SECRET

Optional:
  --timeout-ms <number>   (default: 30000)
`)
}

main().catch(error => {
	let message = error instanceof Error ? error.message : String(error)
	console.error("\nFAIL:", message)
	process.exit(1)
})
