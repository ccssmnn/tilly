import { isDeleted, UserAccount } from "#shared/schema/user"
import { useAccount } from "jazz-tools/react"
import type { useIntl } from "#shared/intl"
import {
	getStarterPrompts,
	type Person,
	type StarterPrompt,
} from "../lib/starter-prompts"

export { useStarterPrompts }

function useStarterPrompts(t: ReturnType<typeof useIntl>): StarterPrompt[] {
	let people = useAccount(UserAccount, {
		resolve: {
			root: { people: { $each: { reminders: { $each: true } } } },
		},
		select: account => {
			if (!account.$isLoaded) return []
			return Array.from(account.root.people).filter(
				p => p.$isLoaded && !isDeleted(p),
			) as unknown as Person[]
		},
	})

	return getStarterPrompts(people, t)
}
