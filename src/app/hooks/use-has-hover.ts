import { useSyncExternalStore } from "react"

// Module-level state for touch detection
let detectedTouchDevice = false
let listeners = new Set<() => void>()

function subscribe(callback: () => void) {
	listeners.add(callback)
	return () => listeners.delete(callback)
}

function getSnapshot() {
	if (detectedTouchDevice) return false
	if (typeof window === "undefined") return false
	return window.matchMedia("(hover: hover)").matches
}

function getServerSnapshot() {
	return false
}

// Setup touch detection once
if (typeof window !== "undefined") {
	window.addEventListener(
		"touchstart",
		() => {
			if (!detectedTouchDevice) {
				detectedTouchDevice = true
				listeners.forEach(cb => cb())
			}
		},
		{ passive: true, once: true },
	)

	// Listen for media query changes
	window.matchMedia("(hover: hover)").addEventListener("change", () => {
		listeners.forEach(cb => cb())
	})
}

export function useHasHover() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
