import { UserAccount } from "#shared/schema/user"
import type { ResolveQuery, co } from "jazz-tools"

export { preloadSettings, settingsResolve, type SettingsAccount }

let settingsResolve = {
	profile: true,
	root: {
		assistant: true,
		notificationSettings: true,
		usageTracking: true,
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type SettingsAccount = co.loaded<typeof UserAccount, typeof settingsResolve>

async function preloadSettings(accountId: string): Promise<SettingsAccount> {
	let me = await UserAccount.load(accountId, { resolve: settingsResolve })
	if (!me.$isLoaded) throw new Error("Failed to load settings")
	return me
}
