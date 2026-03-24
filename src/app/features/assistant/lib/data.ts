import { UserAccount } from "#shared/schema/user"
import type { co, ResolveQuery } from "jazz-tools"

export { assistantResolve, type AssistantAccount, preloadAssistant }

let assistantResolve = {
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

type AssistantAccount = co.loaded<typeof UserAccount, typeof assistantResolve>

async function preloadAssistant(accountId: string): Promise<AssistantAccount> {
	let me = await UserAccount.load(accountId, { resolve: assistantResolve })
	if (!me.$isLoaded) throw new Error("Failed to load account")
	return me
}
