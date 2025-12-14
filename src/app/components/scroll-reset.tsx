import { useEffect } from "react"
import { useRouterState } from "@tanstack/react-router"

export function ScrollReset({
	containerId = "scroll-area",
}: {
	containerId: string
}) {
	let { location } = useRouterState()

	useEffect(() => {
		history.scrollRestoration = "manual"
		let el = document.getElementById(containerId)
		if (!el) return
		let reset = () => el.scrollTo({ top: 0, left: 0, behavior: "instant" })
		requestAnimationFrame(() => requestAnimationFrame(reset))
	}, [location.pathname, containerId])

	return null
}
