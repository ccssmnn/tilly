import { UserAccount } from "#shared/schema/user"
import type { co, ResolveQuery } from "jazz-tools"

export { resolve, type LoadedAssistantAccount, preloadAssistant }

let resolve = {
	profile: true,
	root: {
		people: {
			$each: {
				reminders: { $each: { $onError: "catch" } },
				$onError: "catch",
			},
		},
		assistant: { stringifiedMessages: true },
		notificationSettings: true,
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAssistantAccount = co.loaded<typeof UserAccount, typeof resolve>

async function preloadAssistant(
	accountId: string,
): Promise<LoadedAssistantAccount> {
	let me = await UserAccount.load(accountId, { resolve })
	if (!me.$isLoaded) throw new Error("Failed to load account")
	return me
}
