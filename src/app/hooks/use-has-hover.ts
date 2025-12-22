import { useState, useEffect } from "react"

export function useHasHover() {
	let [hasHover, setHasHover] = useState(() => {
		if (typeof window === "undefined") return false
		return window.matchMedia("(hover: hover)").matches
	})

	useEffect(() => {
		let mql = window.matchMedia("(hover: hover)")
		let onChange = () => setHasHover(mql.matches)
		mql.addEventListener("change", onChange)
		return () => mql.removeEventListener("change", onChange)
	}, [])

	return hasHover
}
