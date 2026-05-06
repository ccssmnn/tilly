import { Markdown } from "#shared/ui/markdown"

export { MarkdownWithHighlight }

function MarkdownWithHighlight({
	content,
	searchQuery,
}: {
	content: string
	searchQuery?: string
}) {
	if (!searchQuery?.trim()) {
		return <Markdown>{content}</Markdown>
	}

	let terms = extractSearchTerms(searchQuery.trim())
	if (terms.length === 0) {
		return <Markdown>{content}</Markdown>
	}

	let pattern = terms.map(escapeRegExp).join("|")
	let parts = content.split(new RegExp(`(${pattern})`, "gi"))
	let highlighted = parts
		.map(part => {
			let isMatch = terms.some(
				term => part.toLowerCase() === term.toLowerCase(),
			)
			return isMatch
				? `<mark class="bg-yellow-200 text-yellow-900">${part}</mark>`
				: part
		})
		.join("")

	return <Markdown>{highlighted}</Markdown>
}

function extractSearchTerms(query: string): string[] {
	let terms: string[] = []
	let hashtagMatch = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (hashtagMatch) terms.push(hashtagMatch[1])
	let rest = query.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (rest) terms.push(rest)
	return terms
}

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
