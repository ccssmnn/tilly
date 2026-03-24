import { Result } from "better-result"

export { processAllUsers, removeStaleRefs }

type UserResult = { userId: string; success: boolean } | undefined

type RefLike = {
	userId: string
	notificationSettings: { $isLoaded: boolean } | undefined
}

function processAllUsers<R extends RefLike>(
	refs: Record<string, R | undefined>,
	isStale: (ref: R) => boolean,
	callback: (ref: R, currentUtc: Date) => Promise<UserResult>,
) {
	return Result.await(
		Result.tryPromise({
			try: async () => {
				let results: Array<{ userId: string; success: boolean }> = []
				let staleRefKeys: string[] = []
				let currentUtc = new Date()
				let promises: Promise<void>[] = []
				let maxConcurrent = 50

				for (let [settingsId, ref] of Object.entries(refs)) {
					if (!ref) continue

					let settings = ref.notificationSettings
					if (!settings?.$isLoaded) continue

					if (isStale(ref)) {
						staleRefKeys.push(settingsId)
						continue
					}

					if (promises.length >= maxConcurrent) {
						await Promise.race(promises)
					}

					let promise = callback(ref, currentUtc)
						.then(result => {
							if (result) results.push(result)
						})
						.catch((error: unknown) => {
							let message =
								error instanceof Error ? error.message : String(error)
							console.error(`[Push] ${ref.userId}: ${message}`)
						})
						.finally(() => {
							let index = promises.indexOf(promise)
							if (index > -1) promises.splice(index, 1)
						})

					promises.push(promise)
				}

				await Promise.allSettled(promises)
				return { results, staleRefKeys }
			},
			catch: error => {
				throw error
			},
		}),
	)
}

function removeStaleRefs(
	refs: { $jazz: { delete(key: string): void } },
	staleRefKeys: string[],
) {
	for (let key of staleRefKeys) {
		refs.$jazz.delete(key)
	}
}
