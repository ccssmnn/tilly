import {
	Person,
	isDeleted,
	isPermanentlyDeleted,
	sortByUpdatedAt,
	sortByDeletedAt,
} from "#shared/schema/user"
import { hasHashtag } from "#app/features/list-utilities"
import { co } from "jazz-tools"

export {
	usePeople,
	extractListFilterFromQuery,
	setListFilterInQuery,
	extractSearchWithoutFilter,
}

type PeopleFilterOptions = {
	listFilter: string | null
	statusFilter: "active" | "deleted"
	sortMode: "recent" | "alphabetical"
}

function usePeople<A extends readonly P[], P extends co.loaded<typeof Person>>(
	allPeople: A,
	searchQuery: string,
	inactivePeople?: A,
	options?: PeopleFilterOptions,
): P[] {
	let allCombinedPeople = [...allPeople, ...(inactivePeople ?? [])].filter(
		p => !isPermanentlyDeleted(p),
	)

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
			statusFilter === "active"
				? !isDeleted(person)
				: isDeleted(person) && !isPermanentlyDeleted(person)

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

function extractListFilterFromQuery(query: string): string | null {
	let match = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	return match ? match[1].toLowerCase() : null
}

function setListFilterInQuery(query: string, filter: string | null): string {
	let withoutFilter = query.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (!filter) return withoutFilter
	if (filter === "All") return withoutFilter
	return filter ? `${filter} ${withoutFilter}`.trim() : withoutFilter
}

function extractSearchWithoutFilter(query: string): string {
	return query
		.toLowerCase()
		.replace(/^#[a-zA-Z0-9_]+\s*/, "")
		.trim()
}
