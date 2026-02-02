import { startWorker } from "jazz-tools/worker"

import {
	PUBLIC_JAZZ_SYNC_SERVER,
	PUBLIC_JAZZ_WORKER_ACCOUNT,
} from "astro:env/client"
import { JAZZ_WORKER_SECRET } from "astro:env/server"

import { UserAccount } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"

export { initUserWorker, initServerWorker, WorkerTimeoutError }

class WorkerTimeoutError extends Error {
	constructor() {
		super("Worker initialization timed out")
		this.name = "WorkerTimeoutError"
	}
}

async function initUserWorker(user: {
	unsafeMetadata: Record<string, unknown>
}) {
	let jazzAccountId = user.unsafeMetadata.jazzAccountID as string
	let jazzAccountSecret = user.unsafeMetadata.jazzAccountSecret as string

	let timeoutPromise = new Promise<never>((_, reject) =>
		setTimeout(() => reject(new WorkerTimeoutError()), 30000),
	)

	let workerResult = await Promise.race([
		startWorker({
			AccountSchema: UserAccount,
			syncServer: PUBLIC_JAZZ_SYNC_SERVER,
			accountID: jazzAccountId,
			accountSecret: jazzAccountSecret,
			skipInboxLoad: true,
		}),
		timeoutPromise,
	])

	return { worker: workerResult.worker }
}

async function initServerWorker() {
	let workerResult = await startWorker({
		AccountSchema: ServerAccount,
		syncServer: PUBLIC_JAZZ_SYNC_SERVER,
		accountID: PUBLIC_JAZZ_WORKER_ACCOUNT,
		accountSecret: JAZZ_WORKER_SECRET,
		skipInboxLoad: true,
		asActiveAccount: false,
	})

	return { worker: workerResult.worker }
}
