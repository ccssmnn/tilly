export { TextHighlight }

function TextHighlight({ text, query }: { text: string; query?: string }) {
	if (!query || !text) {
		return text
	}

	let trimmedQuery = query.trim()
	if (!trimmedQuery) {
		return text
	}

	let terms = extractSearchTerms(trimmedQuery)
	if (terms.length === 0) {
		return text
	}

	let pattern = terms.map(escapeRegExp).join("|")
	let parts = text.split(new RegExp(`(${pattern})`, "gi"))

	return (
		<>
			{parts.map((part, index) => {
				let isMatch = terms.some(
					term => part.toLowerCase() === term.toLowerCase(),
				)
				return isMatch ? (
					<mark key={index} className="bg-yellow-200 text-yellow-900">
						{part}
					</mark>
				) : (
					part
				)
			})}
		</>
	)
}

function extractSearchTerms(query: string): string[] {
	let trimmed = query.trim()
	let terms: string[] = []
	let hashtagMatch = trimmed.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (hashtagMatch) {
		terms.push(hashtagMatch[1])
	}
	let searchWithoutFilter = trimmed.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (searchWithoutFilter) {
		terms.push(searchWithoutFilter)
	}
	return terms
}

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
