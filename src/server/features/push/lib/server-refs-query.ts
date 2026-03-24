import type { ResolveQuery } from "jazz-tools"
import { ServerAccount } from "#shared/schema/server"

export { serverRefsQuery }

let serverRefsQuery = {
	root: {
		notificationSettingsRefsV2: {
			$each: { notificationSettings: true },
		},
	},
} as const satisfies ResolveQuery<typeof ServerAccount>
