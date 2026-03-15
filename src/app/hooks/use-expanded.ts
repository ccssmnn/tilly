import { useState } from "react"

let expandedIDs = new Set<string>()

export function useExpanded(id: string) {
	let [prevId, setPrevId] = useState(id)
	let [isExpanded, setIsExpanded] = useState(() => expandedIDs.has(id))

	if (id !== prevId) {
		setPrevId(id)
		setIsExpanded(expandedIDs.has(id))
	}

	function toggleExpanded() {
		if (isExpanded) {
			setIsExpanded(false)
			expandedIDs.delete(id)
		} else {
			setIsExpanded(true)
			expandedIDs.add(id)
		}
	}

	return { isExpanded, toggleExpanded }
}
