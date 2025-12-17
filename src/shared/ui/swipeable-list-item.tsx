import {
	animate,
	clamp,
	motion,
	useMotionValue,
	useSpring,
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

let BUTTON_SIZE = 56
let BUTTON_GAP = 8

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
			className={className}
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
	let [isSwiping, setIsSwiping] = useState(false)

	let swipeItemRef = useRef<HTMLDivElement>(null)
	let swipeContainerRef = useRef<HTMLDivElement>(null)
	let swipeItemWidth = useRef(0)
	let swipeStartX = useRef(0)
	let swipeStartOffset = useRef(0)
	let fullSwipeSnapPosition = useRef<"left" | "right" | null>(null)

	let swipeAmount = useMotionValue(0)
	let swipeAmountSpring = useSpring(swipeAmount, {
		stiffness: 400,
		damping: 40,
	})

	// Reset swipe state on mount (handles virtualized list item reuse)
	useEffect(() => {
		swipeAmount.jump(0)
		swipeAmountSpring.jump(0)
		fullSwipeSnapPosition.current = null
	}, [swipeAmount, swipeAmountSpring])

	useEffect(() => {
		function handlePointerMove(info: PointerEvent) {
			if (!isSwiping) return

			let itemWidth = swipeItemWidth.current
			if (!itemWidth) return

			let swipeDelta =
				info.clientX - swipeStartX.current + swipeStartOffset.current

			// Constrain swipe direction based on available actions
			if (!rightActions && swipeDelta > 0) swipeDelta = 0
			if (!leftAction && swipeDelta < 0) swipeDelta = 0

			let fullSwipeThreshold = itemWidth * 0.6
			let isSwipingBeyondThreshold = Math.abs(swipeDelta) > fullSwipeThreshold
			let isSwipingLeft = swipeDelta < 0

			if (fullSwipeSnapPosition.current) {
				let isSwipingBackToCenter = Math.abs(swipeDelta) < fullSwipeThreshold
				if (isSwipingBackToCenter) {
					fullSwipeSnapPosition.current = null
					swipeAmount.set(swipeDelta)
				} else {
					let snapPosition =
						fullSwipeSnapPosition.current === "left" ? -itemWidth : itemWidth
					swipeAmount.set(snapPosition)
				}
				return
			}

			if (isSwipingBeyondThreshold) {
				let snapDirection: "left" | "right" = isSwipingLeft ? "left" : "right"
				let snapPosition = isSwipingLeft ? -itemWidth : itemWidth
				fullSwipeSnapPosition.current = snapDirection
				swipeAmount.set(snapPosition)
			} else {
				swipeAmount.set(clamp(-itemWidth, itemWidth, swipeDelta))
			}
		}

		function handlePointerUp() {
			if (!isSwiping) return

			let itemWidth = swipeItemWidth.current
			if (!itemWidth) return

			let currentOffset = swipeAmount.get()
			let targetOffset = 0

			// Calculate snap position based on number of actions
			let rightActionCount = rightActions ? (rightActions.secondary ? 2 : 1) : 0
			let rightSnapWidth =
				rightActionCount * BUTTON_SIZE + (rightActionCount + 1) * BUTTON_GAP
			let leftSnapWidth = leftAction ? BUTTON_SIZE + 2 * BUTTON_GAP : 0

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
				animate(swipeAmount, targetOffset, { duration: 0.3, delay: 0.1 })
			} else {
				animate(swipeAmount, targetOffset, { duration: 0.2 })
			}

			setIsSwiping(false)
			fullSwipeSnapPosition.current = null
		}

		document.addEventListener("pointermove", handlePointerMove)
		document.addEventListener("pointerup", handlePointerUp)

		return () => {
			document.removeEventListener("pointermove", handlePointerMove)
			document.removeEventListener("pointerup", handlePointerUp)
		}
	}, [swipeAmount, isSwiping, leftAction, rightActions])

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
				setIsSwiping(true)
				swipeStartX.current = info.clientX
				swipeStartOffset.current = swipeAmount.get()
			}}
		>
			<motion.div
				ref={swipeItemRef}
				className="bg-background relative z-10"
				style={{ x: swipeAmountSpring }}
			>
				{children}
			</motion.div>

			{/* rightActions are revealed when swiping right, so they sit on the left */}
			{rightActions && (
				<ActionsGroup
					side="left"
					swipeAmount={swipeAmountSpring}
					primaryAction={rightActions.primary}
					secondaryAction={rightActions.secondary}
					onReset={() => animate(swipeAmount, 0, { duration: 0.2 })}
				/>
			)}

			{/* leftAction is revealed when swiping left, so it sits on the right */}
			{leftAction && (
				<SingleActionGroup
					side="right"
					swipeAmount={swipeAmountSpring}
					action={leftAction}
					onReset={() => animate(swipeAmount, 0, { duration: 0.2 })}
				/>
			)}
		</motion.div>
	)
}

function ActionsGroup({
	swipeAmount,
	side,
	primaryAction,
	secondaryAction,
	onReset,
}: {
	swipeAmount: MotionValue<number>
	side: "left" | "right"
	primaryAction: SwipeAction
	secondaryAction?: SwipeAction
	onReset: () => void
}) {
	// side="left" shows when swiping right (positive), side="right" shows when swiping left (negative)
	let isLeft = side === "left"

	// Primary scales in first - only for correct swipe direction
	let primaryScale = useTransform(swipeAmount, value => {
		// Only animate for the correct swipe direction
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < BUTTON_GAP) return 0
		let progress = (absValue - BUTTON_GAP) / BUTTON_SIZE
		return clamp(0, 1, progress)
	})

	// Secondary scales in after primary is fully visible
	let secondaryThreshold = BUTTON_SIZE + BUTTON_GAP * 2
	let secondaryScale = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < secondaryThreshold) return 0
		let progress = (absValue - secondaryThreshold) / BUTTON_SIZE
		return clamp(0, 1, progress)
	})

	// Primary stretches only after secondary is fully visible (if present)
	let stretchThreshold = secondaryAction
		? BUTTON_SIZE * 2 + BUTTON_GAP * 3
		: BUTTON_SIZE + BUTTON_GAP * 2
	let primaryWidth = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return BUTTON_SIZE
		if (!isLeft && value >= 0) return BUTTON_SIZE
		let absValue = Math.abs(value)
		if (absValue < stretchThreshold) return BUTTON_SIZE
		return BUTTON_SIZE + (absValue - stretchThreshold)
	})

	return (
		<div
			className={cn(
				"absolute inset-y-0 z-0 flex items-center gap-2 px-2 select-none",
				isLeft ? "left-0" : "right-0",
				isLeft ? "" : "flex-row-reverse",
			)}
		>
			{/* Primary action (outer, stretches) */}
			<motion.button
				type="button"
				onClick={() => {
					primaryAction.onAction()
					onReset()
				}}
				className="flex flex-col items-center justify-center gap-1 text-white active:opacity-80"
				style={{
					scale: primaryScale,
					transformOrigin: isLeft ? "left center" : "right center",
				}}
			>
				<motion.div
					className={cn(
						"flex items-center justify-center rounded-full",
						COLOR_MAP[primaryAction.color],
					)}
					style={{
						width: primaryWidth,
						height: BUTTON_SIZE,
						borderRadius: BUTTON_SIZE / 2,
					}}
				>
					<primaryAction.icon className="size-6" />
				</motion.div>
				<span className="text-muted-foreground text-[11px]">
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
					className="flex flex-col items-center justify-center gap-1 text-white active:opacity-80"
					style={{
						scale: secondaryScale,
						transformOrigin: isLeft ? "left center" : "right center",
					}}
				>
					<div
						className={cn(
							"flex items-center justify-center rounded-full",
							COLOR_MAP[secondaryAction.color],
						)}
						style={{
							width: BUTTON_SIZE,
							height: BUTTON_SIZE,
							borderRadius: BUTTON_SIZE / 2,
						}}
					>
						<secondaryAction.icon className="size-6" />
					</div>
					<span className="text-muted-foreground text-[11px]">
						{secondaryAction.label}
					</span>
				</motion.button>
			)}
		</div>
	)
}

function SingleActionGroup({
	swipeAmount,
	side,
	action,
	onReset,
}: {
	swipeAmount: MotionValue<number>
	side: "left" | "right"
	action: SwipeAction
	onReset: () => void
}) {
	// side="left" shows when swiping right (positive), side="right" shows when swiping left (negative)
	let isLeft = side === "left"

	let scale = useTransform(swipeAmount, value => {
		// Only animate for the correct swipe direction
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < BUTTON_GAP) return 0
		let progress = (absValue - BUTTON_GAP) / BUTTON_SIZE
		return clamp(0, 1, progress)
	})

	let stretchThreshold = BUTTON_SIZE + BUTTON_GAP * 2
	let buttonWidth = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return BUTTON_SIZE
		if (!isLeft && value >= 0) return BUTTON_SIZE
		let absValue = Math.abs(value)
		if (absValue < stretchThreshold) return BUTTON_SIZE
		return BUTTON_SIZE + (absValue - stretchThreshold)
	})

	let origin = side === "left" ? "left center" : "right center"

	return (
		<motion.div
			className={cn(
				"absolute inset-y-0 z-0 flex items-center px-2 select-none",
				side === "right" ? "left-full flex-row-reverse" : "right-full",
			)}
			style={{ x: swipeAmount }}
		>
			<motion.button
				type="button"
				onClick={() => {
					action.onAction()
					onReset()
				}}
				className="flex flex-col items-center justify-center gap-1 text-white active:opacity-80"
				style={{ scale, transformOrigin: origin }}
			>
				<motion.div
					className={cn(
						"flex items-center justify-center rounded-full",
						COLOR_MAP[action.color],
					)}
					style={{
						width: buttonWidth,
						height: BUTTON_SIZE,
						borderRadius: BUTTON_SIZE / 2,
					}}
				>
					<action.icon className="size-6" />
				</motion.div>
				<span className="text-muted-foreground text-[11px]">
					{action.label}
				</span>
			</motion.button>
		</motion.div>
	)
}
