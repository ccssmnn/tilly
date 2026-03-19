import {
	UserAccount,
	isDeleted,
	sortByUpdatedAt,
	sortByDeletedAt,
} from "#shared/schema/user"
import { useAccount } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"

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

type PeopleFilterOptions = {
	listFilter: string | null
	statusFilter: "active" | "deleted"
	sortMode: "recent" | "alphabetical"
}

type PersonLike = {
	name: string
	summary?: string
	deletedAt?: Date
	updatedAt?: Date
	createdAt?: Date
	$jazz: {
		lastUpdatedAt: number
		createdAt: number
	}
}

function filterPeople<P extends PersonLike>(
	allPeople: readonly P[],
	searchQuery: string,
	inactivePeople?: readonly P[],
	options?: PeopleFilterOptions,
): P[] {
	let allCombinedPeople = [...allPeople, ...(inactivePeople ?? [])]

	let searchLower = searchQuery.toLowerCase().trim()
	let listFilter = options?.listFilter ?? null
	let statusFilter = options?.statusFilter ?? "active"
	let sortMode = options?.sortMode ?? "recent"

	let filteredPeople = allCombinedPeople.filter(person => {
		let matchesSearch =
			!searchLower ||
			person.name.toLowerCase().includes(searchLower) ||
			person.summary?.toLowerCase().includes(searchLower)

		let matchesListFilter = !listFilter || hasHashtag(person, listFilter)

		let matchesStatusFilter =
			statusFilter === "active" ? !isDeleted(person) : isDeleted(person)

		return matchesSearch && matchesListFilter && matchesStatusFilter
	})

	if (sortMode === "alphabetical") {
		filteredPeople.sort((a, b) => a.name.localeCompare(b.name))
	} else {
		if (statusFilter === "deleted") {
			sortByDeletedAt(filteredPeople)
		} else {
			sortByUpdatedAt(filteredPeople)
		}
	}

	return filteredPeople
}

function extractHashtags(summary?: string): string[] {
	if (!summary) return []
	let matches = summary.match(/(?:^|\s)(#[a-zA-Z0-9_]+)/g)
	return (matches || []).map(tag => tag.trim().toLowerCase())
}

function hasHashtag(
	person: {
		summary?: string
	},
	tag: string,
): boolean {
	let hashtags = extractHashtags(person.summary)
	return hashtags.includes(tag.toLowerCase())
}
