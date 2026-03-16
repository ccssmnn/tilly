import { type ReactNode, useEffect, useRef, useState } from "react"
import { cn } from "#app/lib/utils"

export { CollapsibleContent, contentHasOverflow }

let COLLAPSED_HEIGHT = 96
let CHAR_LIMIT = 280
let LINE_LIMIT = 4

function contentHasOverflow(content: string): boolean {
	let lines = content.split("\n")
	return content.length > CHAR_LIMIT || lines.length > LINE_LIMIT
}

function CollapsibleContent({
	isExpanded,
	hasOverflow,
	children,
}: {
	isExpanded: boolean
	hasOverflow: boolean
	children: ReactNode
}) {
	let innerRef = useRef<HTMLDivElement>(null)
	let [expandedHeight, setExpandedHeight] = useState(COLLAPSED_HEIGHT)

	useEffect(() => {
		if (!hasOverflow) return

		function updateHeight() {
			let nextHeight = innerRef.current?.scrollHeight ?? COLLAPSED_HEIGHT
			setExpandedHeight(nextHeight)
		}

		updateHeight()

		let element = innerRef.current
		if (!element || typeof ResizeObserver === "undefined") return

		let observer = new ResizeObserver(() => updateHeight())
		observer.observe(element)

		return () => observer.disconnect()
	}, [children, hasOverflow])

	if (!hasOverflow) return children

	return (
		<div
			className={cn(
				"overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none",
				!isExpanded &&
					"[mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]",
			)}
			style={{ maxHeight: isExpanded ? expandedHeight : COLLAPSED_HEIGHT }}
		>
			<div ref={innerRef}>{children}</div>
		</div>
	)
}
