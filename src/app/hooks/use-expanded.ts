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

	function setExpanded(open: boolean) {
		expandedId = open ? id : null
		if (!open) window.getSelection()?.removeAllRanges()
		notify()
	}

	function toggleExpanded() {
		setExpanded(!isExpanded)
	}

	function closeExpanded() {
		if (isExpanded) setExpanded(false)
	}

	return { isExpanded, setExpanded, toggleExpanded, closeExpanded }
}
