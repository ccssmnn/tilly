import * as React from "react"

let MOBILE_BREAKPOINT = 768

export function useIsMobile() {
	let [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

	React.useEffect(() => {
		let mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
		let onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		}
		mql.addEventListener("change", onChange)
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		return () => mql.removeEventListener("change", onChange)
	}, [])

	return !!isMobile
}
