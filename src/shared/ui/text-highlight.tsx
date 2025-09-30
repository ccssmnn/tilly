export { TextHighlight }

function TextHighlight({ text, query }: { text: string; query?: string }) {
	if (!query || !text) {
		return text
	}

	let trimmedQuery = query.trim()
	if (!trimmedQuery) {
		return text
	}

	let parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi"))

	return (
		<>
			{parts.map((part, index) => {
				let isMatch = part.toLowerCase() === trimmedQuery.toLowerCase()
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

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
