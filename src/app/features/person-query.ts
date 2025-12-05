import { co, type ResolveQuery } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"

export { personListQuery }
export type { LoadedPerson }

let personListQuery = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
			},
		},
		inactivePeople: {
			$each: {
				avatar: true,
				reminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAccount = co.loaded<typeof UserAccount, typeof personListQuery>
type LoadedPerson = NonNullable<LoadedAccount["root"]["people"]>[number]
