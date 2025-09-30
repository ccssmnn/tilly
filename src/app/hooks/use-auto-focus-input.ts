import { useEffect, useRef } from "react"

export function useAutoFocusInput() {
	let inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			let target = e.target as HTMLElement
			let isInputElement =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.contentEditable === "true"

			if (
				!isInputElement &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.altKey &&
				e.key.length === 1 &&
				inputRef.current
			) {
				inputRef.current.focus()
				// Let the browser handle the character insertion naturally
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [])

	return inputRef
}
