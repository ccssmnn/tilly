import { useSyncExternalStore } from "react"

let MOBILE_BREAKPOINT = 768
let MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function subscribe(onStoreChange: () => void) {
	let mql = window.matchMedia(MOBILE_QUERY)
	mql.addEventListener("change", onStoreChange)
	return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
	return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot() {
	return false
}
