import { useEffect } from "react"

export { useSelectionAwareToggle }

/**
 * Hook that manages selection-aware toggling.
 * - Clears text selection when expanded state becomes false
 * - Returns a click handler that prevents toggle when text is selected
 */
function useSelectionAwareToggle(
	isExpanded: boolean,
	toggle: () => void,
): () => void {
	// Clear text selection when collapsing
	useEffect(() => {
		if (!isExpanded) {
			window.getSelection()?.removeAllRanges()
		}
	}, [isExpanded])

	// Return click handler that ignores clicks when text is selected
	function handleClick() {
		let selection = window.getSelection()
		if (selection && selection.toString().trim()) {
			// Text is selected, don't toggle (selection will be cleared on collapse)
			return
		}
		toggle()
	}

	return handleClick
}
