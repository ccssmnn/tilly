import { type ReactNode } from "react"
import { useElementScrollRestoration } from "@tanstack/react-router"
import {
	defaultRangeExtractor,
	useWindowVirtualizer,
} from "@tanstack/react-virtual"

type VirtualEntry<T> =
	| { type: "header" }
	| { type: "item"; value: T }
	| { type: "fallback" }
	| { type: "spacer" }

export function VirtualizedList<T>({
	items,
	staticHeader,
	fallback,
	renderItem,
}: VirtualizedListProps<T>) {
	let entries: Array<VirtualEntry<T>> = []
	if (staticHeader) entries.push({ type: "header" })

	if (items.length === 0 && fallback) {
		entries.push({ type: "fallback" })
	} else {
		for (let item of items) entries.push({ type: "item", value: item })
	}

	entries.push({ type: "spacer" })

	let headerCount = staticHeader ? 1 : 0

	let scrollEntry = useElementScrollRestoration({
		getElement: () => window,
	})

	let virtualizer = useWindowVirtualizer({
		count: entries.length,
		estimateSize: () => 100,
		overscan: 5,
		initialOffset: scrollEntry?.scrollY,
		rangeExtractor: range => {
			let pinned = Array.from({ length: headerCount }, (_, i) => i)
			let dynamic = defaultRangeExtractor(range).filter(i => i >= headerCount)
			return [...pinned, ...dynamic]
		},
		measureElement: (element, _entry, instance) => {
			if (instance.scrollDirection === "backward") {
				let index = Number(element.getAttribute("data-index"))
				let cached = instance.measurementsCache[index]?.size
				if (cached) return cached
			}
			return element.getBoundingClientRect().height
		},
	})

	let virtualRows = virtualizer.getVirtualItems()

	let fallbackContent = fallback

	return (
		<div
			className="md:mt-12"
			style={{
				height: virtualizer.getTotalSize(),
				width: "100%",
				position: "relative",
			}}
		>
			{virtualRows.map(virtualRow => {
				let entry = entries[virtualRow.index]!

				return (
					<div
						key={virtualRow.key}
						data-index={virtualRow.index}
						ref={virtualizer.measureElement}
						className="absolute top-0 left-0 w-full"
						style={{ transform: `translateY(${virtualRow.start}px)` }}
					>
						{entry.type === "header" ? (
							staticHeader
						) : entry.type === "fallback" ? (
							fallbackContent
						) : entry.type === "spacer" ? (
							<div className="h-24" />
						) : (
							renderItem(entry.value)
						)}
					</div>
				)
			})}
		</div>
	)
}

type VirtualizedListProps<T> = {
	items: Array<T>
	staticHeader?: ReactNode
	fallback?: ReactNode
	renderItem: (item: T) => ReactNode
}
