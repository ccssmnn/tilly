import {
	animate,
	clamp,
	motion,
	useMotionValue,
	useTransform,
	type MotionValue,
} from "motion/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "#app/lib/utils"

export { SwipeableListItem }
export type { SwipeAction, SwipeableListItemProps }

type SwipeAction = {
	icon: React.ComponentType<{ className?: string }>
	label: string
	color: "destructive" | "primary" | "success" | "warning"
	onAction: () => void | Promise<unknown>
}

type SwipeableListItemProps = {
	children: React.ReactNode
	itemKey?: string
	leftAction?: SwipeAction
	rightActions?: {
		primary: SwipeAction
		secondary?: SwipeAction
	}
	disabled?: boolean
	className?: string
}

let COLOR_MAP = {
	destructive: "bg-destructive",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
} as const

let BUTTON_HEIGHT = 52
let BUTTON_GAP = 6
let SPRING_CONFIG = { type: "spring", stiffness: 500, damping: 35 } as const
let FULL_SWIPE_THRESHOLD = 0.5
let RESISTANCE_FACTOR = 0.3

function SwipeableListItem({
	children,
	itemKey,
	leftAction,
	rightActions,
	disabled,
	className,
}: SwipeableListItemProps) {
	let [isTouchDevice] = useState(() =>
		typeof window !== "undefined"
			? window.matchMedia("(pointer: coarse)").matches
			: false,
	)

	if (!isTouchDevice || disabled || (!leftAction && !rightActions)) {
		return <div className={className}>{children}</div>
	}

	return (
		<SwipeableContent
			key={itemKey}
			leftAction={leftAction}
			rightActions={rightActions}
			className={cn("-mx-3 md:mx-0", className)}
		>
			{children}
		</SwipeableContent>
	)
}

function SwipeableContent({
	children,
	leftAction,
	rightActions,
	className,
}: Omit<SwipeableListItemProps, "disabled">) {
	let swipeItemRef = useRef<HTMLDivElement>(null)
	let swipeContainerRef = useRef<HTMLDivElement>(null)
	let rightActionsRef = useRef<HTMLDivElement>(null)
	let leftActionsRef = useRef<HTMLDivElement>(null)
	let swipeItemWidth = useRef(0)
	let swipeStartX = useRef(0)
	let swipeStartY = useRef(0)
	let swipeStartOffset = useRef(0)
	let fullSwipeSnapPosition = useRef<"left" | "right" | null>(null)
	// "pending" = pointer down, waiting for direction; "horizontal" = swiping; null = idle
	let swipeState = useRef<"pending" | "horizontal" | null>(null)
	let didSwipeRef = useRef(false)

	let swipeAmount = useMotionValue(0)
	let isFullSwipe = useMotionValue(false)

	// Reset swipe state on mount (handles virtualized list item reuse)
	useEffect(() => {
		swipeAmount.jump(0)
		fullSwipeSnapPosition.current = null
	}, [swipeAmount])

	useEffect(() => {
		function handlePointerMove(info: PointerEvent) {
			if (!swipeState.current) return

			let itemWidth = swipeItemWidth.current
			if (!itemWidth) return

			let deltaX = info.clientX - swipeStartX.current
			let deltaY = info.clientY - swipeStartY.current

			// Determine swipe direction on first significant movement
			if (swipeState.current === "pending") {
				let absX = Math.abs(deltaX)
				let absY = Math.abs(deltaY)
				let threshold = 10

				if (absX < threshold && absY < threshold) return

				if (absY > absX) {
					// Vertical scroll - cancel and let browser handle it
					swipeState.current = null
					return
				}
				swipeState.current = "horizontal"
			}

			let swipeDelta = deltaX + swipeStartOffset.current

			// Constrain swipe direction based on available actions
			if (!rightActions && swipeDelta > 0) swipeDelta = 0
			if (!leftAction && swipeDelta < 0) swipeDelta = 0

			let fullSwipeThreshold = itemWidth * FULL_SWIPE_THRESHOLD
			let isSwipingBeyondThreshold = Math.abs(swipeDelta) > fullSwipeThreshold
			let isSwipingLeft = swipeDelta < 0

			// Track full swipe state
			if (isSwipingBeyondThreshold) {
				if (!fullSwipeSnapPosition.current) {
					fullSwipeSnapPosition.current = isSwipingLeft ? "left" : "right"
					isFullSwipe.set(true)
				}
			} else {
				if (fullSwipeSnapPosition.current) {
					fullSwipeSnapPosition.current = null
					isFullSwipe.set(false)
				}
			}

			// Always follow drag, but with resistance after threshold
			let position: number
			if (isSwipingBeyondThreshold) {
				// Apply resistance: slow down movement beyond threshold
				let thresholdPos = fullSwipeThreshold * Math.sign(swipeDelta)
				let overshoot = Math.abs(swipeDelta) - fullSwipeThreshold
				let resistedOvershoot = overshoot * RESISTANCE_FACTOR
				position = thresholdPos + resistedOvershoot * Math.sign(swipeDelta)
			} else {
				position = swipeDelta
			}
			swipeAmount.set(clamp(-itemWidth, itemWidth, position))
		}

		function handlePointerUp() {
			if (!swipeState.current) return

			let itemWidth = swipeItemWidth.current
			if (!itemWidth) return

			let currentOffset = swipeAmount.get()
			let targetOffset = 0

			// Mark as swiped if we moved horizontally at all
			if (swipeState.current === "horizontal" && Math.abs(currentOffset) > 5) {
				didSwipeRef.current = true
				// Reset didSwipe after a short delay to allow click prevention
				setTimeout(() => (didSwipeRef.current = false), 100)
			}

			// Use base width from data attribute (excludes stretch)
			let rightSnapWidth = rightActionsRef.current
				? Number(rightActionsRef.current.dataset.baseWidth || 0) + BUTTON_GAP
				: 0
			let leftSnapWidth = leftActionsRef.current
				? Number(leftActionsRef.current.dataset.baseWidth || 0) + BUTTON_GAP
				: 0

			let snapThreshold = itemWidth * 0.15

			if (Math.abs(currentOffset) > snapThreshold) {
				if (currentOffset > 0 && rightActions) {
					targetOffset = rightSnapWidth
				} else if (currentOffset < 0 && leftAction) {
					targetOffset = -leftSnapWidth
				}
			}

			let isFullySwiped = fullSwipeSnapPosition.current
			if (isFullySwiped) {
				let action =
					isFullySwiped === "right" ? rightActions?.primary : leftAction

				if (action) {
					animate([
						[
							swipeContainerRef.current!,
							{
								scaleY: 1.02,
								scaleX: 0.98,
								pointerEvents: "none",
							},
							{ duration: 0.1, ease: "easeOut" },
						],
						[
							swipeContainerRef.current!,
							{ scaleY: 1, scaleX: 1, pointerEvents: "auto" },
							{ duration: 0.4, type: "spring" },
						],
					])

					action.onAction()
				}

				targetOffset = 0
				animate(swipeAmount, targetOffset, { ...SPRING_CONFIG, delay: 0.1 })
			} else {
				animate(swipeAmount, targetOffset, SPRING_CONFIG)
			}

			swipeState.current = null
			fullSwipeSnapPosition.current = null
			isFullSwipe.set(false)
		}

		document.addEventListener("pointermove", handlePointerMove)
		document.addEventListener("pointerup", handlePointerUp)

		return () => {
			document.removeEventListener("pointermove", handlePointerMove)
			document.removeEventListener("pointerup", handlePointerUp)
		}
	}, [swipeAmount, isFullSwipe, leftAction, rightActions])

	useEffect(() => {
		function handleResize() {
			let newWidth = swipeItemRef.current?.getBoundingClientRect().width
			if (!newWidth) return

			swipeItemWidth.current = newWidth
			swipeAmount.jump(0)
		}

		handleResize()
		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [swipeAmount])

	return (
		<motion.div
			ref={swipeContainerRef}
			className={cn("relative overflow-hidden", className)}
			style={{ touchAction: "pan-y" }}
			onPointerDown={info => {
				if (info.pointerType !== "touch") return
				swipeState.current = "pending"
				swipeStartX.current = info.clientX
				swipeStartY.current = info.clientY
				swipeStartOffset.current = swipeAmount.get()
			}}
			onClickCapture={e => {
				// Prevent click if we just finished a swipe
				if (didSwipeRef.current) {
					e.preventDefault()
					e.stopPropagation()
				}
			}}
		>
			<motion.div
				ref={swipeItemRef}
				className="bg-background relative px-3 md:px-0"
				style={{ x: swipeAmount }}
			>
				{children}
			</motion.div>

			{/* rightActions are revealed when swiping right, so they sit on the left */}
			{rightActions && (
				<ActionsGroup
					ref={rightActionsRef}
					side="left"
					swipeAmount={swipeAmount}
					isFullSwipe={isFullSwipe}
					primaryAction={rightActions.primary}
					secondaryAction={rightActions.secondary}
					onReset={() => animate(swipeAmount, 0, SPRING_CONFIG)}
				/>
			)}

			{/* leftAction is revealed when swiping left, so it sits on the right */}
			{leftAction && (
				<SingleActionGroup
					ref={leftActionsRef}
					side="right"
					swipeAmount={swipeAmount}
					isFullSwipe={isFullSwipe}
					action={leftAction}
					onReset={() => animate(swipeAmount, 0, SPRING_CONFIG)}
				/>
			)}
		</motion.div>
	)
}

function ActionsGroup({
	swipeAmount,
	isFullSwipe,
	side,
	primaryAction,
	secondaryAction,
	onReset,
	ref,
}: {
	swipeAmount: MotionValue<number>
	isFullSwipe: MotionValue<boolean>
	side: "left" | "right"
	primaryAction: SwipeAction
	secondaryAction?: SwipeAction
	onReset: () => void
	ref: React.Ref<HTMLDivElement>
}) {
	let isLeft = side === "left"

	let primaryLabelRef = useRef<HTMLSpanElement>(null)
	let secondaryLabelRef = useRef<HTMLSpanElement>(null)
	let [primaryLabelWidth, setPrimaryLabelWidth] = useState(BUTTON_HEIGHT)
	let [secondaryLabelWidth, setSecondaryLabelWidth] = useState(BUTTON_HEIGHT)

	let containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (primaryLabelRef.current) {
			let width = primaryLabelRef.current.offsetWidth
			setPrimaryLabelWidth(Math.max(BUTTON_HEIGHT, width))
		}
		if (secondaryLabelRef.current) {
			let width = secondaryLabelRef.current.offsetWidth
			setSecondaryLabelWidth(Math.max(BUTTON_HEIGHT, width))
		}
	}, [primaryAction.label, secondaryAction?.label])

	// Store base width (unstretched) in data attribute for snap calculation
	let baseWidth =
		primaryLabelWidth +
		(secondaryAction ? secondaryLabelWidth + BUTTON_GAP : 0) +
		BUTTON_GAP * 2
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.dataset.baseWidth = String(baseWidth)
		}
	}, [baseWidth])

	let primaryScale = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < BUTTON_GAP) return 0
		return clamp(0, 1, (absValue - BUTTON_GAP) / primaryLabelWidth)
	})

	let secondaryThreshold = primaryLabelWidth + BUTTON_GAP * 2
	let secondaryScale = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < secondaryThreshold) return 0
		return clamp(0, 1, (absValue - secondaryThreshold) / secondaryLabelWidth)
	})

	// Primary stretches only after secondary is fully visible (if present)
	let stretchThreshold = secondaryAction
		? primaryLabelWidth + secondaryLabelWidth + BUTTON_GAP * 3
		: primaryLabelWidth + BUTTON_GAP * 2
	let primaryWidth = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return primaryLabelWidth
		if (!isLeft && value >= 0) return primaryLabelWidth
		let absValue = Math.abs(value)
		if (absValue < stretchThreshold) return primaryLabelWidth
		return primaryLabelWidth + (absValue - stretchThreshold)
	})

	return (
		<div
			ref={(node: HTMLDivElement | null) => {
				containerRef.current = node
				if (typeof ref === "function") ref(node)
				else if (ref) ref.current = node
			}}
			className={cn(
				"absolute inset-y-0 flex items-center gap-1.5 px-1.5 select-none",
				isLeft ? "left-0" : "right-0",
				isLeft ? "" : "flex-row-reverse",
			)}
		>
			{/* Hidden labels for measuring */}
			<span
				ref={primaryLabelRef}
				className="pointer-events-none invisible absolute text-[10px] leading-tight whitespace-nowrap"
			>
				{primaryAction.label}
			</span>
			{secondaryAction && (
				<span
					ref={secondaryLabelRef}
					className="pointer-events-none invisible absolute text-[10px] leading-tight whitespace-nowrap"
				>
					{secondaryAction.label}
				</span>
			)}

			{/* Primary action (outer, stretches) */}
			<motion.button
				type="button"
				onClick={() => {
					primaryAction.onAction()
					onReset()
				}}
				className="flex flex-col items-center justify-center gap-0.5 active:opacity-80"
				style={{
					scale: primaryScale,
					transformOrigin: isLeft ? "left center" : "right center",
				}}
			>
				<motion.div
					className={cn(
						"flex items-center justify-center text-white",
						COLOR_MAP[primaryAction.color],
					)}
					style={{
						width: primaryWidth,
						height: BUTTON_HEIGHT,
						borderRadius: BUTTON_HEIGHT / 2,
					}}
				>
					<WigglingIcon icon={primaryAction.icon} isFullSwipe={isFullSwipe} />
				</motion.div>
				<span className="text-muted-foreground text-[10px] leading-tight whitespace-nowrap">
					{primaryAction.label}
				</span>
			</motion.button>

			{/* Secondary action (inner) */}
			{secondaryAction && (
				<motion.button
					type="button"
					onClick={() => {
						secondaryAction.onAction()
						onReset()
					}}
					className="flex flex-col items-center justify-center gap-0.5 active:opacity-80"
					style={{
						scale: secondaryScale,
						transformOrigin: isLeft ? "left center" : "right center",
					}}
				>
					<div
						className={cn(
							"flex items-center justify-center text-white",
							COLOR_MAP[secondaryAction.color],
						)}
						style={{
							width: secondaryLabelWidth,
							height: BUTTON_HEIGHT,
							borderRadius: BUTTON_HEIGHT / 2,
						}}
					>
						<secondaryAction.icon className="size-5" />
					</div>
					<span className="text-muted-foreground text-[10px] leading-tight whitespace-nowrap">
						{secondaryAction.label}
					</span>
				</motion.button>
			)}
		</div>
	)
}

function SingleActionGroup({
	swipeAmount,
	isFullSwipe,
	side,
	action,
	onReset,
	ref,
}: {
	swipeAmount: MotionValue<number>
	isFullSwipe: MotionValue<boolean>
	side: "left" | "right"
	action: SwipeAction
	onReset: () => void
	ref: React.Ref<HTMLDivElement>
}) {
	let isLeft = side === "left"

	let labelRef = useRef<HTMLSpanElement>(null)
	let containerRef = useRef<HTMLDivElement>(null)
	let [labelWidth, setLabelWidth] = useState(BUTTON_HEIGHT)

	useEffect(() => {
		if (labelRef.current) {
			let width = labelRef.current.offsetWidth
			setLabelWidth(Math.max(BUTTON_HEIGHT, width))
		}
	}, [action.label])

	// Store base width (unstretched) in data attribute for snap calculation
	let baseWidth = labelWidth + BUTTON_GAP * 2
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.dataset.baseWidth = String(baseWidth)
		}
	}, [baseWidth])

	let scale = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < BUTTON_GAP) return 0
		return clamp(0, 1, (absValue - BUTTON_GAP) / labelWidth)
	})

	let stretchThreshold = labelWidth + BUTTON_GAP * 2
	let buttonWidth = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return labelWidth
		if (!isLeft && value >= 0) return labelWidth
		let absValue = Math.abs(value)
		if (absValue < stretchThreshold) return labelWidth
		return labelWidth + (absValue - stretchThreshold)
	})

	return (
		<div
			ref={(node: HTMLDivElement | null) => {
				containerRef.current = node
				if (typeof ref === "function") ref(node)
				else if (ref) ref.current = node
			}}
			className={cn(
				"absolute inset-y-0 flex items-center px-1.5 select-none",
				isLeft ? "left-0" : "right-0",
			)}
		>
			{/* Hidden label for measuring */}
			<span
				ref={labelRef}
				className="pointer-events-none invisible absolute text-xs leading-tight whitespace-nowrap"
			>
				{action.label}
			</span>

			<motion.button
				type="button"
				onClick={() => {
					action.onAction()
					onReset()
				}}
				className="flex flex-col items-center justify-center gap-0.5 active:opacity-80"
				style={{
					scale,
					transformOrigin: isLeft ? "left center" : "right center",
				}}
			>
				<motion.div
					className={cn(
						"flex items-center justify-center text-white",
						COLOR_MAP[action.color],
					)}
					style={{
						width: buttonWidth,
						height: BUTTON_HEIGHT,
						borderRadius: BUTTON_HEIGHT / 2,
					}}
				>
					<WigglingIcon icon={action.icon} isFullSwipe={isFullSwipe} />
				</motion.div>
				<span className="text-muted-foreground text-xs leading-tight whitespace-nowrap">
					{action.label}
				</span>
			</motion.button>
		</div>
	)
}

function WigglingIcon({
	icon: Icon,
	isFullSwipe,
}: {
	icon: React.ComponentType<{ className?: string }>
	isFullSwipe: MotionValue<boolean>
}) {
	let rotation = useMotionValue(0)
	let animationRef = useRef<ReturnType<typeof animate> | null>(null)

	useEffect(() => {
		function startWiggle() {
			if (animationRef.current) return
			let wiggle = () => {
				animationRef.current = animate(rotation, [0, -12, 12, -12, 12, 0], {
					duration: 0.4,
					ease: "easeInOut",
					onComplete: () => {
						if (animationRef.current) wiggle()
					},
				})
			}
			wiggle()
		}

		function stopWiggle() {
			animationRef.current?.stop()
			animationRef.current = null
			rotation.set(0)
		}

		return isFullSwipe.on("change", shouldWiggle => {
			if (shouldWiggle) {
				startWiggle()
			} else {
				stopWiggle()
			}
		})
	}, [isFullSwipe, rotation])

	return (
		<motion.span className="inline-flex" style={{ rotate: rotation }}>
			<Icon className="size-5" />
		</motion.span>
	)
}
