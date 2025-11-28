import { extractHashtags, hasDueReminders } from "#shared/schema/user"

export { useAvailableLists, extractListFilterFromQuery, setListFilterInQuery }

interface AvailableList {
	tag: string
	count: number
}

function useAvailableLists(people: unknown[]): {
	all: AvailableList
	due: AvailableList
	hashtags: AvailableList[]
} {
	let allHashtags = new Map<string, number>()
	let dueCount = 0
	let totalCount = 0

	for (let person of people) {
		if (!person || typeof person !== "object") continue
		if (!("summary" in person) || !("reminders" in person)) continue

		totalCount++
		let summary = person.summary as string | undefined
		let hashtags = extractHashtags(summary)

		for (let tag of hashtags) {
			allHashtags.set(tag, (allHashtags.get(tag) ?? 0) + 1)
		}

		if (
			hasDueReminders(
				person as {
					reminders?: {
						$isLoaded?: boolean
						values?: () => Array<{ done?: boolean; dueAtDate?: string }>
					}
				},
			)
		) {
			dueCount++
		}
	}

	let hashtags = Array.from(allHashtags.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count)

	return {
		all: { tag: "All", count: totalCount },
		due: { tag: "#due", count: dueCount },
		hashtags,
	}
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
