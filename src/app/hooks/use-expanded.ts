import { useSyncExternalStore } from "react"

let expandedId: string | null = null
let listeners = new Set<() => void>()

function subscribe(listener: () => void) {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

function notify() {
	for (let listener of listeners) listener()
}

export function useExpanded(id: string) {
	let currentExpandedId = useSyncExternalStore(subscribe, () => expandedId)
	let isExpanded = currentExpandedId === id

	function toggleExpanded() {
		expandedId = isExpanded ? null : id
		notify()
	}

	function closeExpanded() {
		if (isExpanded) {
			expandedId = null
			notify()
		}
	}

	return { isExpanded, toggleExpanded, closeExpanded }
}
