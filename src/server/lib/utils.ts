import { startWorker } from "jazz-tools/worker"
import { co } from "jazz-tools"

import {
	PUBLIC_JAZZ_SYNC_SERVER,
	PUBLIC_JAZZ_WORKER_ACCOUNT,
} from "astro:env/client"
import { JAZZ_WORKER_SECRET } from "astro:env/server"

import { UserAccount } from "#shared/schema/user"
import { ServerAccount } from "#shared/schema/server"

export { initUserWorker, getServerWorker, WorkerTimeoutError }
export type { ServerWorker }

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

	let workerInitPromise = startWorker({
		AccountSchema: ServerAccount,
		syncServer: PUBLIC_JAZZ_SYNC_SERVER,
		accountID: PUBLIC_JAZZ_WORKER_ACCOUNT,
		accountSecret: JAZZ_WORKER_SECRET,
		skipInboxLoad: true,
		asActiveAccount: false,
	})
		.then(result => result.worker)
		.catch(error => {
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

async function initUserWorker(user: {
	unsafeMetadata: Record<string, unknown>
}): Promise<{ worker: co.loaded<typeof UserAccount>; shutdown(): void }> {
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
	})

	let workerResult = await Promise.race([workerPromise, timeoutPromise])

	let resolved = false
	const shutdown = async () => {
		if (resolved) return
		resolved = true
		try {
			const result = await workerPromise
			await result.shutdownWorker?.()
		} catch {
			// ignore cleanup errors
		}
	}

	workerPromise
		.then(() => {
			resolved = true
		})
		.catch(() => {
			resolved = true
		})

	return { worker: workerResult.worker, shutdown }
}
