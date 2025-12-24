import { createFileRoute } from "@tanstack/react-router"
import { useRef, useLayoutEffect, useEffect } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { Trash, PencilFill, ArchiveFill } from "react-bootstrap-icons"

export const Route = createFileRoute("/swipe-test")({
	component: SwipeTestComponent,
})

function SwipeTestComponent() {
	let items = [
		{ id: 1, name: "Alice Johnson", note: "Met at conference" },
		{ id: 2, name: "Bob Smith", note: "College friend" },
		{ id: 3, name: "Carol Williams", note: "Work colleague" },
		{ id: 4, name: "David Brown", note: "Neighbor" },
		{ id: 5, name: "Eva Martinez", note: "Gym buddy" },
	]

	return (
		<div className="bg-background min-h-screen p-4">
			<h1 className="mb-4 text-2xl font-bold">Swipe Test</h1>
			<p className="text-muted-foreground mb-6 text-sm">
				Scroll horizontally on items to reveal actions. Keep scrolling to
				stretch buttons.
			</p>
			<div className="space-y-2">
				{items.map(item => (
					<SwipeableItem key={item.id} item={item} />
				))}
			</div>
		</div>
	)
}

type Item = { id: number; name: string; note: string }

let BUTTON_WIDTH = 64
let STRETCH_AMOUNT = 60

function SwipeableItem({ item }: { item: Item }) {
	let containerRef = useRef<HTMLDivElement>(null)
	let itemRef = useRef<HTMLDivElement>(null)
	let triggeredRef = useRef(false)

	let { scrollX } = useScroll({ container: containerRef })

	// Left button grows to cover stretch area
	let leftButtonWidth = useTransform(scrollX, v => {
		if (v >= STRETCH_AMOUNT) return BUTTON_WIDTH
		return BUTTON_WIDTH + (STRETCH_AMOUNT - v)
	})

	// Right button grows to cover stretch area
	let rightButtonWidth = useTransform(scrollX, v => {
		let container = containerRef.current
		if (!container) return BUTTON_WIDTH
		let maxScroll = container.scrollWidth - container.clientWidth
		let stretchStart = maxScroll - STRETCH_AMOUNT
		if (v <= stretchStart) return BUTTON_WIDTH
		return BUTTON_WIDTH + (v - stretchStart)
	})

	// Background color transitions from muted to full as we enter trigger zone
	let leftBg = useTransform(scrollX, v => {
		let progress = Math.max(
			0,
			Math.min(1, (STRETCH_AMOUNT - v) / STRETCH_AMOUNT),
		)
		return `hsl(var(--primary) / ${0.5 + progress * 0.5})`
	})
	let rightBg = useTransform(scrollX, v => {
		let container = containerRef.current
		if (!container) return "rgb(239 68 68 / 0.5)"
		let maxScroll = container.scrollWidth - container.clientWidth
		let progress = Math.max(
			0,
			Math.min(1, (v - (maxScroll - STRETCH_AMOUNT)) / STRETCH_AMOUNT),
		)
		return `rgb(239 68 68 / ${0.5 + progress * 0.5})`
	})

	useLayoutEffect(() => {
		let container = containerRef.current
		let item = itemRef.current
		if (!container || !item) return
		container.scrollTo({ left: item.offsetLeft })
	}, [])

	// Detect trigger and reset
	useEffect(() => {
		let unsub = scrollX.on("change", v => {
			let container = containerRef.current
			let itemEl = itemRef.current
			if (!container || !itemEl) return

			let maxScroll = container.scrollWidth - container.clientWidth
			let itemLeft = itemEl.offsetLeft

			// Reset trigger lock when back at initial position
			if (Math.abs(v - itemLeft) < 5) {
				triggeredRef.current = false
				return
			}

			// Left trigger zone
			if (v <= 2 && !triggeredRef.current) {
				triggeredRef.current = true
				console.log("Edit triggered for:", item.name)
				container.scrollTo({ left: itemLeft, behavior: "smooth" })
			}

			// Right trigger zone
			if (v >= maxScroll - 2 && !triggeredRef.current) {
				triggeredRef.current = true
				console.log("Delete triggered for:", item.name)
				container.scrollTo({ left: itemLeft, behavior: "smooth" })
			}
		})

		return () => unsub()
	}, [scrollX, item.name])

	function handleAction(action: string) {
		console.log(`${action} clicked for:`, item.name)
		let container = containerRef.current
		let itemEl = itemRef.current
		if (container && itemEl) {
			container.scrollTo({ left: itemEl.offsetLeft, behavior: "smooth" })
		}
	}

	return (
		<div
			ref={containerRef}
			className="flex overflow-x-auto rounded-lg"
			style={{
				scrollSnapType: "x mandatory",
				scrollbarWidth: "none",
				overscrollBehaviorX: "none",
			}}
		>
			{/* Snap point 1: Edit button - grows left on overscroll */}
			<motion.button
				onClick={() => handleAction("Edit")}
				className="text-primary-foreground flex shrink-0 items-center justify-end pr-4"
				style={{
					width: leftButtonWidth,
					scrollSnapAlign: "start",
					backgroundColor: leftBg,
				}}
			>
				<PencilFill className="size-5" />
			</motion.button>

			{/* Left secondary - Archive */}
			<button
				onClick={() => handleAction("Archive")}
				className="flex shrink-0 items-center justify-center bg-blue-500/50 text-white"
				style={{ width: BUTTON_WIDTH }}
			>
				<ArchiveFill className="size-5" />
			</button>

			{/* Snap point 2: Main item (initial state) */}
			<div
				ref={itemRef}
				className="bg-card text-card-foreground shrink-0 p-4"
				style={{
					width: "100%",
					scrollSnapAlign: "start",
				}}
			>
				<div className="font-medium">{item.name}</div>
				<div className="text-muted-foreground text-sm">{item.note}</div>
			</div>

			{/* Snap point 3: Delete button - grows right on overscroll */}
			<motion.button
				onClick={() => handleAction("Delete")}
				className="flex shrink-0 items-center justify-start pl-4 text-white"
				style={{
					width: rightButtonWidth,
					scrollSnapAlign: "end",
					backgroundColor: rightBg,
				}}
			>
				<Trash className="size-5" />
			</motion.button>
		</div>
	)
}
