import {
	Person,
	isDeleted,
	isPermanentlyDeleted,
	sortByUpdatedAt,
	sortByDeletedAt,
} from "#shared/schema/user"
import { co } from "jazz-tools"

export { usePeople }

function usePeople<A extends readonly P[], P extends co.loaded<typeof Person>>(
	allPeople: A,
	searchQuery: string,
): { active: P[]; deleted: P[] } {
	let searchLower = searchQuery.toLowerCase().trim()
	let visiblePeople = allPeople.filter(person => !isPermanentlyDeleted(person))

	let filteredPeople = searchQuery
		? visiblePeople.filter(
				person =>
					person.name.toLowerCase().includes(searchLower) ||
					person.summary?.toLowerCase().includes(searchLower),
			)
		: visiblePeople

	let active = filteredPeople.filter(person => !isDeleted(person))
	let deleted = filteredPeople.filter(
		person => isDeleted(person) && !isPermanentlyDeleted(person),
	)

	sortByUpdatedAt(active)
	sortByDeletedAt(deleted)

	return { active, deleted }
}
