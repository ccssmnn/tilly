#!/usr/bin/env tsx

import { UsageTracking } from "../src/shared/schema/user"
import { createClerkClient } from "@clerk/backend"
import { startWorker } from "jazz-tools/worker"
import { ServerAccount } from "../src/shared/schema/server"

type ServerWorker = Awaited<ReturnType<typeof startWorker>>["worker"]

// Load environment variables
let CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
let PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.PUBLIC_CLERK_PUBLISHABLE_KEY
let PUBLIC_JAZZ_SYNC_SERVER = process.env.PUBLIC_JAZZ_SYNC_SERVER
let PUBLIC_JAZZ_WORKER_ACCOUNT = process.env.PUBLIC_JAZZ_WORKER_ACCOUNT
let JAZZ_WORKER_SECRET = process.env.JAZZ_WORKER_SECRET

if (!CLERK_SECRET_KEY || !PUBLIC_CLERK_PUBLISHABLE_KEY) {
	console.error(
		"❌ Missing required Clerk environment variables: CLERK_SECRET_KEY, PUBLIC_CLERK_PUBLISHABLE_KEY",
	)
	process.exit(1)
}

if (
	!PUBLIC_JAZZ_SYNC_SERVER ||
	!PUBLIC_JAZZ_WORKER_ACCOUNT ||
	!JAZZ_WORKER_SECRET
) {
	console.error(
		"❌ Missing required Jazz environment variables: PUBLIC_JAZZ_SYNC_SERVER, PUBLIC_JAZZ_WORKER_ACCOUNT, JAZZ_WORKER_SECRET",
	)
	process.exit(1)
}

let jazzWorker: ServerWorker | null = null

async function initJazzWorker() {
	if (jazzWorker) return jazzWorker

	console.log("🎵 Initializing Jazz worker...")

	let workerResult = await startWorker({
		AccountSchema: ServerAccount,
		syncServer: PUBLIC_JAZZ_SYNC_SERVER,
		accountID: PUBLIC_JAZZ_WORKER_ACCOUNT,
		accountSecret: JAZZ_WORKER_SECRET,
		skipInboxLoad: true,
	})

	jazzWorker = workerResult.worker
	console.log("✅ Jazz worker initialized")
	return jazzWorker
}

async function resetUsageForUser(usageTrackingId: string, userId: string) {
	try {
		let usageTracking = await UsageTracking.load(usageTrackingId)
		if (!usageTracking.$isLoaded) {
			console.warn(`  ⚠️  Usage tracking not found for user ${userId}`)
			return false
		}

		let usagePercent = usageTracking.weeklyPercentUsed ?? 0

		console.log(`  📊 Current usage: ${usagePercent.toFixed(1)}% of budget`)

		usageTracking.$jazz.set("weeklyPercentUsed", 0)

		console.log(`  ⏳ Waiting for sync...`)
		await usageTracking.$jazz.waitForSync()

		console.log(`  ✅ Reset successfully`)
		return true
	} catch (error) {
		console.error(`  ❌ Failed to reset usage for user ${userId}:`, error)
		return false
	}
}

async function resetAllUsage() {
	console.log("🚀 Starting bulk usage reset...")

	// Initialize Jazz worker to load CoValues
	await initJazzWorker()

	// Initialize Clerk client
	let clerkClient = createClerkClient({
		secretKey: CLERK_SECRET_KEY,
		publishableKey: PUBLIC_CLERK_PUBLISHABLE_KEY,
	})

	try {
		console.log("📋 Fetching users from Clerk...")

		let users = []
		let hasMore = true
		let offset = 0
		let limit = 100

		while (hasMore) {
			let response = await clerkClient.users.getUserList({
				limit,
				offset,
			})

			users.push(...response.data)
			hasMore = response.data.length === limit
			offset += limit
		}

		console.log(`📊 Found ${users.length} users`)

		let resetCount = 0
		let skipCount = 0

		for (let [index, user] of users.entries()) {
			console.log(`\n[${index + 1}/${users.length}] Processing user ${user.id}`)

			// Get usage tracking ID from user metadata
			let usageTrackingId = user.unsafeMetadata?.usageTrackingId as
				| string
				| undefined

			if (!usageTrackingId) {
				console.log(`  ⏭️  No usage tracking found, skipping`)
				skipCount++
				continue
			}

			let success = await resetUsageForUser(usageTrackingId, user.id)
			if (success) {
				resetCount++
			}
		}

		console.log(`\n🎉 Reset completed!`)
		console.log(`✅ Successfully reset: ${resetCount} users`)
		console.log(`⏭️  Skipped (no usage tracking): ${skipCount} users`)
	} catch (error) {
		console.error("❌ Failed to fetch users or reset usage:", error)
	}
}

async function resetSingleUser(usageTrackingId: string) {
	console.log(`🎯 Resetting usage for ID: ${usageTrackingId}`)

	// Initialize Jazz worker to load CoValues
	await initJazzWorker()

	await resetUsageForUser(usageTrackingId, "unknown")
}

// Main execution
async function main() {
	try {
		if (process.argv[2]) {
			await resetSingleUser(process.argv[2])
		} else {
			await resetAllUsage()
		}
		process.exit(0)
	} catch (error) {
		console.error("❌ Script failed:", error)
		process.exit(1)
	}
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

// Usage:
// tsx scripts/reset-usage.ts                    # Reset all users
// tsx scripts/reset-usage.ts <usageTrackingId> # Reset specific user
