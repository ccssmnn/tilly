import { useState, useEffect } from "react"

export function useInputFocusState() {
	let [isInputFocused, setIsInputFocused] = useState(false)

	useEffect(() => {
		function handleFocusIn(e: FocusEvent) {
			let target = e.target as HTMLElement
			if (target.matches("input, textarea, select")) {
				setIsInputFocused(true)
			}
		}

		function handleFocusOut(e: FocusEvent) {
			let target = e.target as HTMLElement
			if (target.matches("input, textarea, select")) {
				setIsInputFocused(false)
			}
		}

		document.addEventListener("focusin", handleFocusIn)
		document.addEventListener("focusout", handleFocusOut)

		return () => {
			document.removeEventListener("focusin", handleFocusIn)
			document.removeEventListener("focusout", handleFocusOut)
		}
	}, [])

	return isInputFocused
}
