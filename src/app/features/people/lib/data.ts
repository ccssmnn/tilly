import { UserAccount } from "#shared/schema/user"
import { useAccount } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"
import { filterPeople } from "./filters"

export { preloadPeopleWithPeople, usePeopleData }
export type { PeopleData, LoadedPerson }

let resolve = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: { $onError: "catch" } },
				$onError: "catch",
			},
		},
		inactivePeople: {
			$each: {
				avatar: true,
				reminders: { $each: { $onError: "catch" } },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

type LoadedAccount = co.loaded<typeof UserAccount, typeof resolve>
type MaybeLoadedPeopleList = LoadedAccount["root"]["people"]
type MaybeLoadedPerson = NonNullable<MaybeLoadedPeopleList>[number]
type LoadedPerson = Extract<MaybeLoadedPerson, { $isLoaded: true }>

type PeopleData = {
	people: LoadedPerson[]
	allPeople: LoadedPerson[]
	hasPeople: boolean
}

async function preloadPeopleWithPeople(
	accountId: string,
): Promise<LoadedAccount> {
	let me = await UserAccount.load(accountId, { resolve })
	if (!me.$isLoaded) throw new Error("Failed to load account")
	return me
}

function usePeopleData(
	fallback: LoadedAccount,
	options?: {
		query?: string
		statusFilter?: "active" | "deleted"
		listFilter?: string | null
		sortMode?: "recent" | "alphabetical"
	},
): PeopleData {
	let subscribed = useAccount(UserAccount, { resolve })
	let me = subscribed.$isLoaded ? subscribed : fallback

	let allPeople = filterVisiblePeople(me.root?.people)
	let inactivePeople = filterVisiblePeople(me.root?.inactivePeople)

	let hasPeople = allPeople.length > 0 || inactivePeople.length > 0

	let people = filterPeople(allPeople, options?.query ?? "", inactivePeople, {
		listFilter: options?.listFilter ?? null,
		statusFilter: options?.statusFilter ?? "active",
		sortMode: options?.sortMode ?? "recent",
	})

	return { people, allPeople, hasPeople }
}

function filterVisiblePeople(
	people: MaybeLoadedPeopleList | undefined,
): LoadedPerson[] {
	if (!people) return []
	return people.filter((person): person is LoadedPerson =>
		Boolean(person && person.$isLoaded),
	)
}
