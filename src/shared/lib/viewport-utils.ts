import { useEffect, useState } from "react"

export { calculateEagerLoadCount, useVisualViewportHeight }

function calculateEagerLoadCount(): number {
	if (typeof window === "undefined") return 6

	return Math.ceil(window.innerHeight / 96)
}

function useVisualViewportHeight(): number {
	let [height, setHeight] = useState(() =>
		typeof window !== "undefined" && window.visualViewport
			? window.visualViewport.height
			: typeof window !== "undefined"
				? window.innerHeight
				: 0,
	)

	useEffect(() => {
		if (typeof window === "undefined" || !window.visualViewport) return

		let viewport = window.visualViewport

		function handleResize() {
			setHeight(viewport.height)
		}

		viewport.addEventListener("resize", handleResize)
		return () => viewport.removeEventListener("resize", handleResize)
	}, [])

	return height
}
