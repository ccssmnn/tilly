import { co, type ResolveQuery } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"

export { personListQuery }
export type { LoadedPerson, MaybeLoadedPerson }

let personListQuery = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
				$onError: "catch",
			},
		},
		inactivePeople: {
			$each: {
				avatar: true,
				reminders: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAccount = co.loaded<typeof UserAccount, typeof personListQuery>
// With $onError: "catch", list items may be NotLoaded (unauthorized)
type MaybeLoadedPerson = NonNullable<LoadedAccount["root"]["people"]>[number]
// Narrowed type for successfully loaded people
type LoadedPerson = Extract<MaybeLoadedPerson, { $isLoaded: true }>
