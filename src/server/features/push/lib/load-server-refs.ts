import { Result } from "better-result"
import type { co, Loaded, ResolveQuery } from "jazz-tools"
import { ServerAccount } from "#shared/schema/server"
import { NotFound } from "#server/lib/errors"

export { loadServerRefs, findUserRef }
export type { LoadedRefs, LoadedRef }

let serverRefsQuery = {
	root: {
		notificationSettingsRefsV2: {
			$each: { notificationSettings: true },
		},
	},
} as const satisfies ResolveQuery<typeof ServerAccount>

type LoadedServerAccount = Loaded<typeof ServerAccount, typeof serverRefsQuery>
type LoadedRefs = NonNullable<
	LoadedServerAccount["root"]["notificationSettingsRefsV2"]
>
type LoadedRef = NonNullable<LoadedRefs[string]>

function loadServerRefs(worker: co.loaded<typeof ServerAccount>) {
	return Result.await(
		Result.tryPromise({
			try: async () => {
				let serverAccount = await worker.$jazz.ensureLoaded({
					resolve: serverRefsQuery,
				})
				let refs = serverAccount.root.notificationSettingsRefsV2
				if (!refs) {
					throw new NotFound({ message: "No notification settings refs found" })
				}
				return refs
			},
			catch: error => {
				if (error instanceof NotFound) return error
				throw error
			},
		}),
	)
}

function findUserRef(refs: LoadedRefs, userId: string) {
	let ref = Object.values(refs).find(ref => ref?.userId === userId)
	let notificationSettings = ref?.notificationSettings
	if (!notificationSettings?.$isLoaded) {
		return Result.err(
			new NotFound({ message: "Notification settings not found for user" }),
		)
	}
	return Result.ok({ ref: ref as LoadedRef, notificationSettings })
}
