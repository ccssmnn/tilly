import { startWorker } from "jazz-tools/worker"
import { co } from "jazz-tools"

import {
	PUBLIC_JAZZ_SYNC_SERVER,
	PUBLIC_JAZZ_WORKER_ACCOUNT,
} from "astro:env/client"
import { JAZZ_WORKER_SECRET } from "astro:env/server"

import { UserAccount } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"

export { getUserWorker, getServerWorker, WorkerTimeoutError }
export type { ServerWorker, UserWorker }

class WorkerTimeoutError extends Error {
	constructor() {
		super("Worker initialization timed out")
		this.name = "WorkerTimeoutError"
	}
}

type ServerWorker = co.loaded<typeof ServerAccount>

let cachedServerWorker: ServerWorker | null = null
let serverWorkerPromise: Promise<ServerWorker> | null = null

async function getServerWorker(): Promise<ServerWorker> {
	if (cachedServerWorker) {
		return cachedServerWorker
	}

	if (serverWorkerPromise) {
		return serverWorkerPromise
	}

	let timeoutId: ReturnType<typeof setTimeout> | undefined
	let workerAccountId = PUBLIC_JAZZ_WORKER_ACCOUNT
	let syncServer = PUBLIC_JAZZ_SYNC_SERVER

	let workerInitPromise = startWorker({
		AccountSchema: ServerAccount,
		syncServer,
		accountID: workerAccountId,
		accountSecret: JAZZ_WORKER_SECRET,
		skipInboxLoad: true,
		asActiveAccount: false,
	})
		.then(result => result.worker)
		.catch(error => {
			console.error("[PushWorker] Worker start failed", {
				workerAccountId,
				syncServer,
				error:
					error instanceof Error
						? { name: error.name, message: error.message, stack: error.stack }
						: String(error),
			})
			throw error
		})

	let timeoutPromise = new Promise<ServerWorker>((_, reject) => {
		timeoutId = setTimeout(() => reject(new WorkerTimeoutError()), 30000)
	})

	serverWorkerPromise = Promise.race([workerInitPromise, timeoutPromise])
		.then(worker => {
			cachedServerWorker = worker
			return worker
		})
		.catch(error => {
			serverWorkerPromise = null
			cachedServerWorker = null
			throw error
		})
		.finally(() => {
			if (timeoutId) clearTimeout(timeoutId)
		})

	return serverWorkerPromise
}

type UserWorker = co.loaded<typeof UserAccount>

function getUserWorker(
	user: { unsafeMetadata: Record<string, unknown> },
): () => Promise<UserWorker> {
	return async () => {
		let jazzAccountId = user.unsafeMetadata.jazzAccountID as string
		let jazzAccountSecret = user.unsafeMetadata.jazzAccountSecret as string

		let timeoutPromise = new Promise<never>((_, reject) =>
			setTimeout(() => reject(new WorkerTimeoutError()), 30000),
		)

		let workerPromise = startWorker({
			AccountSchema: UserAccount,
			syncServer: PUBLIC_JAZZ_SYNC_SERVER,
			accountID: jazzAccountId,
			accountSecret: jazzAccountSecret,
			skipInboxLoad: true,
		}).then(result => result.worker)

		return Promise.race([workerPromise, timeoutPromise])
	}
}
