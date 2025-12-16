import {
	animate,
	clamp,
	motion,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
	useTransform,
	type MotionValue,
} from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
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
	leftAction?: SwipeAction
	rightActions?: {
		primary: SwipeAction
		secondary?: SwipeAction
	}
	disabled?: boolean
	className?: string
}

let SPRING_OPTIONS = {
	stiffness: 900,
	damping: 80,
}

let COLOR_MAP = {
	destructive: "bg-destructive",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
} as const

function SwipeableListItem({
	children,
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
	let swipeAmountSpring = useSpring(swipeAmount, SPRING_OPTIONS)
	let swipeProgress = useTransform(swipeAmount, value => {
		let itemWidth = swipeItemWidth.current
		if (!itemWidth) return 0
		return value / itemWidth
	})

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

			let fullSwipeThreshold = itemWidth * 0.8
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

			let snapThreshold = itemWidth * 0.25

			if (Math.abs(currentOffset) > snapThreshold) {
				if (currentOffset > 0 && rightActions) {
					targetOffset = itemWidth * 0.5
				} else if (currentOffset < 0 && leftAction) {
					targetOffset = itemWidth * -0.5
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
								scaleY: 1.05,
								scaleX: 0.95,
								y: -24,
								pointerEvents: "none",
							},
							{ duration: 0.1, ease: "easeOut" },
						],
						[
							swipeContainerRef.current!,
							{ scaleY: 1, scaleX: 1, y: 0, pointerEvents: "auto" },
							{ duration: 0.6, type: "spring" },
						],
					])

					action.onAction()
				}

				targetOffset = 0
				animate(swipeAmount, targetOffset, { duration: 0.5, delay: 0.3 })
			} else {
				swipeAmount.set(targetOffset)
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

			let currentProgress = swipeProgress.get()
			let newOffset = currentProgress * newWidth

			swipeAmount.jump(newOffset)
			swipeAmountSpring.jump(newOffset)
		}

		handleResize()
		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [swipeAmount, swipeAmountSpring, swipeProgress])

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
					swipeProgress={swipeProgress}
					primaryAction={rightActions.primary}
					secondaryAction={rightActions.secondary}
					onReset={() => swipeAmount.set(0)}
				/>
			)}

			{/* leftAction is revealed when swiping left, so it sits on the right */}
			{leftAction && (
				<SingleActionGroup
					side="right"
					swipeAmount={swipeAmountSpring}
					swipeProgress={swipeProgress}
					action={leftAction}
					onReset={() => swipeAmount.set(0)}
				/>
			)}
		</motion.div>
	)
}

function ActionsGroup({
	swipeAmount,
	swipeProgress,
	side,
	primaryAction,
	secondaryAction,
	onReset,
}: {
	swipeAmount: MotionValue<number>
	swipeProgress: MotionValue<number>
	side: "left" | "right"
	primaryAction: SwipeAction
	secondaryAction?: SwipeAction
	onReset: () => void
}) {
	return (
		<motion.div
			className={cn(
				"absolute inset-y-0 flex h-full w-full select-none",
				side === "right" ? "left-full" : "right-full",
			)}
			style={{ x: swipeAmount }}
		>
			{secondaryAction && (
				<Action
					swipeProgress={swipeProgress}
					side={side}
					action={secondaryAction}
					primary={false}
					onReset={onReset}
				/>
			)}
			<Action
				swipeProgress={swipeProgress}
				side={side}
				action={primaryAction}
				primary
				onReset={onReset}
			/>
		</motion.div>
	)
}

function SingleActionGroup({
	swipeAmount,
	swipeProgress,
	side,
	action,
	onReset,
}: {
	swipeAmount: MotionValue<number>
	swipeProgress: MotionValue<number>
	side: "left" | "right"
	action: SwipeAction
	onReset: () => void
}) {
	return (
		<motion.div
			className={cn(
				"absolute inset-y-0 flex h-full w-full select-none",
				side === "right" ? "left-full" : "right-full",
			)}
			style={{ x: swipeAmount }}
		>
			<Action
				swipeProgress={swipeProgress}
				side={side}
				action={action}
				primary
				onReset={onReset}
			/>
		</motion.div>
	)
}

function Action({
	swipeProgress,
	side,
	action,
	primary,
	onReset,
}: {
	swipeProgress: MotionValue<number>
	side: "left" | "right"
	action: SwipeAction
	primary: boolean
	onReset: () => void
}) {
	let ref = useRef<HTMLDivElement>(null)
	let actionWidth = useRef(0)

	let calculateX = useCallback(
		(progress: number) => {
			let width = actionWidth.current
			if (!primary) return 0

			let absProgress = Math.abs(progress)
			if (absProgress >= 0.8) return 0

			return ((progress * width) / 2) * -1
		},
		[primary],
	)

	let x = useSpring(0, SPRING_OPTIONS)
	useMotionValueEvent(swipeProgress, "change", newProgress => {
		let updatedX = calculateX(newProgress)
		x.set(updatedX)
	})

	useEffect(() => {
		function updateWidth() {
			let width = ref.current?.getBoundingClientRect().width
			if (!width) return

			actionWidth.current = width

			let newX = calculateX(swipeProgress.get())
			x.jump(newX)
		}

		updateWidth()
		window.addEventListener("resize", updateWidth)
		return () => window.removeEventListener("resize", updateWidth)
	}, [swipeProgress, x, calculateX])

	let finalStateOpacity = primary ? 1 : 0
	let _contentOpacity = useTransform(
		swipeProgress,
		[-1, -0.8, -0.5, -0.25, 0.25, 0.5, 0.8, 1],
		[finalStateOpacity, 1, 1, 0, 0, 1, 1, finalStateOpacity],
	)
	let contentOpacity = useSpring(_contentOpacity, SPRING_OPTIONS)

	let _contentX = useTransform(
		swipeProgress,
		[-1, -0.8, -0.5, 0.5, 0.8, 1],
		[0, 16, 0, 0, -16, 0],
	)
	let contentX = useSpring(_contentX, SPRING_OPTIONS)

	let _contentScale = useTransform(
		swipeProgress,
		[-1, -0.8, 0, 0.8, 1],
		[1, 0.8, 1, 0.8, 1],
	)
	let contentScale = useSpring(_contentScale, SPRING_OPTIONS)

	let Icon = action.icon

	function handleClick() {
		action.onAction()
		onReset()
	}

	return (
		<motion.div
			ref={ref}
			className={cn(
				"absolute inset-0 flex",
				side === "right" ? "justify-start" : "justify-end",
				COLOR_MAP[action.color],
			)}
			style={{ x }}
		>
			<button
				type="button"
				onClick={handleClick}
				className="flex h-full w-1/4 items-center justify-center"
			>
				<motion.span
					className="flex flex-col items-center gap-1 text-xs text-white"
					style={{
						x: contentX,
						opacity: contentOpacity,
						scale: contentScale,
						transformOrigin: side === "right" ? "right" : "left",
					}}
				>
					<Icon className="size-6" />
					{action.label}
				</motion.span>
			</button>
		</motion.div>
	)
}
