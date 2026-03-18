export {
	useAvailableLists,
	extractListFilterFromQuery,
	setListFilterInQuery,
	removeHashtagFromSummary,
	addHashtagToSummary,
	replaceHashtagInSummary,
	extractHashtags,
	hasHashtag,
}
export type { PersonWithSummary, AvailableList }

type PersonWithSummary = {
	$jazz: { id: string }
	name: string
	summary?: string
}

type AvailableList = {
	tag: string
	count: number
}

function useAvailableLists(people: PersonWithSummary[]): AvailableList[] {
	let allHashtags = new Map<string, number>()

	for (let person of people) {
		let hashtags = extractHashtags(person.summary)

		for (let tag of hashtags) {
			allHashtags.set(tag, (allHashtags.get(tag) ?? 0) + 1)
		}
	}

	let hashtags = Array.from(allHashtags.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count)

	return hashtags
}

function extractListFilterFromQuery(query: string): string | null {
	let match = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	return match ? match[1].toLowerCase() : null
}

function setListFilterInQuery(query: string, filter: string | null): string {
	let withoutFilter = query.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (!filter) return withoutFilter
	return `${filter} ${withoutFilter}`.trim()
}

function removeHashtagFromSummary(
	summary: string | undefined,
	hashtag: string,
): string {
	if (!summary) return ""
	let escaped = hashtag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return summary
		.replace(new RegExp(`${escaped}(?=\\s|$)`, "gi"), "")
		.replace(/\s+/g, " ")
		.trim()
}

function addHashtagToSummary(
	summary: string | undefined,
	hashtag: string,
): string {
	let current = summary?.trim() || ""
	return current ? `${current} ${hashtag}` : hashtag
}

function replaceHashtagInSummary(
	summary: string | undefined,
	oldTag: string,
	newTag: string,
): string {
	if (!summary) return ""
	let escaped = oldTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return summary.replace(new RegExp(`${escaped}(?=\\s|$)`, "gi"), newTag).trim()
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
