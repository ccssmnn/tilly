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

function usePeople<A extends readonly P[], P extends co.loaded<typeof Person>>(
	allPeople: A,
	searchQuery: string,
): { active: P[]; deleted: P[] } {
	let searchLower = searchQuery.toLowerCase().trim()
	let visiblePeople = allPeople.filter(person => !isPermanentlyDeleted(person))

	let listFilter = extractListFilterFromQuery(searchLower)
	let searchWithoutFilter = searchLower.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()

	let filteredPeople = visiblePeople.filter(person => {
		let matchesSearch =
			!searchWithoutFilter ||
			person.name.toLowerCase().includes(searchWithoutFilter) ||
			person.summary?.toLowerCase().includes(searchWithoutFilter)

		let matchesFilter = !listFilter || hasHashtag(person, listFilter)

		return matchesSearch && matchesFilter
	})

	let active = filteredPeople.filter(person => !isDeleted(person))
	let deleted = filteredPeople.filter(
		person => isDeleted(person) && !isPermanentlyDeleted(person),
	)

	sortByUpdatedAt(active)
	sortByDeletedAt(deleted)

	return { active, deleted }
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
