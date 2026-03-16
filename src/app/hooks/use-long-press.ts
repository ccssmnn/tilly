import { useCallback, useEffect, useRef } from "react"

export { useLongPress }

type LongPressHandlers = {
	onPointerDown: (e: React.PointerEvent) => void
	onContextMenu: (e: React.MouseEvent) => void
}

function useLongPress(
	onLongPress: () => void,
	delay = 500,
): { handlers: LongPressHandlers; didLongPress: React.RefObject<boolean> } {
	let timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
	let didLongPress = useRef(false)
	let activeRef = useRef(false)

	let clear = useCallback(() => {
		clearTimeout(timerRef.current)
		activeRef.current = false
	}, [])

	// touchmove/touchend are immune to pointer capture, so they fire
	// even when SwipeableListItem captures the pointer for swipe gestures.
	useEffect(() => {
		function onTouchMove() {
			if (activeRef.current) clear()
		}
		function onTouchEnd() {
			if (activeRef.current) clear()
		}
		document.addEventListener("touchmove", onTouchMove, { passive: true })
		document.addEventListener("touchend", onTouchEnd, { passive: true })
		return () => {
			document.removeEventListener("touchmove", onTouchMove)
			document.removeEventListener("touchend", onTouchEnd)
		}
	}, [clear])

	let onPointerDown = useCallback(() => {
		didLongPress.current = false
		activeRef.current = true
		timerRef.current = setTimeout(() => {
			didLongPress.current = true
			activeRef.current = false
			onLongPress()
		}, delay)
	}, [onLongPress, delay])

	let onContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
	}, [])

	return {
		handlers: { onPointerDown, onContextMenu },
		didLongPress,
	}
}
