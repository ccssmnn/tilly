import { Result } from "better-result"
import { WorkerTimeoutError } from "#server/lib/utils"
import { WorkerTimeout } from "#server/lib/errors"

export { initWorkerSafe }

function initWorkerSafe<T>(factory: () => Promise<T>) {
	return Result.await(
		Result.tryPromise({
			try: factory,
			catch: error => {
				if (error instanceof WorkerTimeoutError)
					return new WorkerTimeout({ message: error.message })
				throw error
			},
		}),
	)
}
