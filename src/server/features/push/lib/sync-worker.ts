import { Result } from "better-result"
import type { co } from "jazz-tools"
import type { ServerAccount } from "#shared/schema/server"
import { SyncFailed } from "#server/lib/errors"

export { syncWorker }

function syncWorker(worker: co.loaded<typeof ServerAccount>) {
	return Result.await(
		Result.tryPromise({
			try: () => worker.$jazz.waitForSync(),
			catch: () => new SyncFailed({ message: "Failed to sync mutations" }),
		}),
	)
}
