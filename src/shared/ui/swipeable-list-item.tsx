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
	let swipeState = useRef<"pending" | "horizontal" | null>(null)
	let didSwipeRef = useRef(false)

	let swipeAmount = useMotionValue(0)
	let isFullSwipe = useMotionValue(false)

	useEffect(() => {
		swipeAmount.jump(0)
		fullSwipeSnapPosition.current = null
	}, [swipeAmount])

	useEffect(() => {
		let refs: SwipeRefs = {
			swipeItemWidth,
			swipeStartX,
			swipeStartY,
			swipeStartOffset,
			fullSwipeSnapPosition,
			swipeState,
			didSwipeRef,
			swipeContainerRef,
			rightActionsRef,
			leftActionsRef,
		}
		let values: SwipeValues = { swipeAmount, isFullSwipe }

		let onMove = (e: PointerEvent) =>
			handlePointerMove(e, refs, values, leftAction, rightActions)
		let onUp = () => handlePointerUp(refs, values, leftAction, rightActions)

		document.addEventListener("pointermove", onMove)
		document.addEventListener("pointerup", onUp)
		return () => {
			document.removeEventListener("pointermove", onMove)
			document.removeEventListener("pointerup", onUp)
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
			onPointerDown={e => {
				if (e.pointerType !== "touch") return
				swipeState.current = "pending"
				swipeStartX.current = e.clientX
				swipeStartY.current = e.clientY
				swipeStartOffset.current = swipeAmount.get()
			}}
			onClickCapture={e => {
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

			{leftAction && (
				<ActionsGroup
					ref={leftActionsRef}
					side="right"
					swipeAmount={swipeAmount}
					isFullSwipe={isFullSwipe}
					primaryAction={leftAction}
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
	let containerRef = useRef<HTMLDivElement>(null)

	let { measureRef: primaryMeasureRef, width: primaryLabelWidth } =
		useLabelWidth(primaryAction.label)
	let { measureRef: secondaryMeasureRef, width: secondaryLabelWidth } =
		useLabelWidth(secondaryAction?.label)

	let baseWidth =
		primaryLabelWidth +
		(secondaryAction ? secondaryLabelWidth + BUTTON_GAP : 0) +
		BUTTON_GAP * 2

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.dataset.baseWidth = String(baseWidth)
		}
	}, [baseWidth])

	let primaryScale = useScaleTransform(
		swipeAmount,
		isLeft,
		BUTTON_GAP,
		primaryLabelWidth,
	)

	let secondaryThreshold = primaryLabelWidth + BUTTON_GAP * 2
	let secondaryScale = useScaleTransform(
		swipeAmount,
		isLeft,
		secondaryThreshold,
		secondaryLabelWidth,
	)

	let stretchThreshold = secondaryAction
		? primaryLabelWidth + secondaryLabelWidth + BUTTON_GAP * 3
		: primaryLabelWidth + BUTTON_GAP * 2
	let primaryButtonWidth = useStretchTransform(
		swipeAmount,
		isLeft,
		stretchThreshold,
		primaryLabelWidth,
	)

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
			<HiddenLabel ref={primaryMeasureRef}>{primaryAction.label}</HiddenLabel>
			{secondaryAction && (
				<HiddenLabel ref={secondaryMeasureRef}>
					{secondaryAction.label}
				</HiddenLabel>
			)}

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
						width: primaryButtonWidth,
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
			if (shouldWiggle) startWiggle()
			else stopWiggle()
		})
	}, [isFullSwipe, rotation])

	return (
		<motion.span className="inline-flex" style={{ rotate: rotation }}>
			<Icon className="size-5" />
		</motion.span>
	)
}

function HiddenLabel({
	children,
	ref,
}: {
	children: string
	ref: React.Ref<HTMLSpanElement>
}) {
	return (
		<span
			ref={ref}
			className="pointer-events-none invisible absolute text-[10px] leading-tight whitespace-nowrap"
		>
			{children}
		</span>
	)
}

// --- Hooks ---

function useLabelWidth(label: string | undefined) {
	let measureRef = useRef<HTMLSpanElement>(null)
	let [width, setWidth] = useState(BUTTON_HEIGHT)

	useEffect(() => {
		if (measureRef.current) {
			setWidth(Math.max(BUTTON_HEIGHT, measureRef.current.offsetWidth))
		}
	}, [label])

	return { measureRef, width }
}

function useScaleTransform(
	swipeAmount: MotionValue<number>,
	isLeft: boolean,
	threshold: number,
	targetWidth: number,
) {
	return useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < threshold) return 0
		return clamp(0, 1, (absValue - threshold) / targetWidth)
	})
}

function useStretchTransform(
	swipeAmount: MotionValue<number>,
	isLeft: boolean,
	threshold: number,
	baseWidth: number,
) {
	return useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return baseWidth
		if (!isLeft && value >= 0) return baseWidth
		let absValue = Math.abs(value)
		if (absValue < threshold) return baseWidth
		return baseWidth + (absValue - threshold)
	})
}

// --- Pointer handlers ---

type SwipeRefs = {
	swipeItemWidth: React.RefObject<number>
	swipeStartX: React.RefObject<number>
	swipeStartY: React.RefObject<number>
	swipeStartOffset: React.RefObject<number>
	fullSwipeSnapPosition: React.RefObject<"left" | "right" | null>
	swipeState: React.RefObject<"pending" | "horizontal" | null>
	didSwipeRef: React.RefObject<boolean>
	swipeContainerRef: React.RefObject<HTMLDivElement | null>
	rightActionsRef: React.RefObject<HTMLDivElement | null>
	leftActionsRef: React.RefObject<HTMLDivElement | null>
}

type SwipeValues = {
	swipeAmount: MotionValue<number>
	isFullSwipe: MotionValue<boolean>
}

function handlePointerMove(
	e: PointerEvent,
	refs: SwipeRefs,
	values: SwipeValues,
	leftAction: SwipeAction | undefined,
	rightActions: SwipeableListItemProps["rightActions"],
) {
	if (!refs.swipeState.current) return

	let itemWidth = refs.swipeItemWidth.current
	if (!itemWidth) return

	let deltaX = e.clientX - refs.swipeStartX.current!
	let deltaY = e.clientY - refs.swipeStartY.current!

	if (refs.swipeState.current === "pending") {
		let absX = Math.abs(deltaX)
		let absY = Math.abs(deltaY)
		if (absX < 10 && absY < 10) return
		if (absY > absX) {
			;(refs.swipeState as React.RefObject<string | null>).current = null
			return
		}
		;(
			refs.swipeState as React.RefObject<"pending" | "horizontal" | null>
		).current = "horizontal"
	}

	let swipeDelta = deltaX + refs.swipeStartOffset.current!
	if (!rightActions && swipeDelta > 0) swipeDelta = 0
	if (!leftAction && swipeDelta < 0) swipeDelta = 0

	let fullSwipeThreshold = itemWidth * FULL_SWIPE_THRESHOLD
	let isSwipingBeyondThreshold = Math.abs(swipeDelta) > fullSwipeThreshold
	let isSwipingLeft = swipeDelta < 0

	if (isSwipingBeyondThreshold) {
		if (!refs.fullSwipeSnapPosition.current) {
			;(
				refs.fullSwipeSnapPosition as React.RefObject<"left" | "right" | null>
			).current = isSwipingLeft ? "left" : "right"
			values.isFullSwipe.set(true)
		}
	} else if (refs.fullSwipeSnapPosition.current) {
		;(
			refs.fullSwipeSnapPosition as React.RefObject<"left" | "right" | null>
		).current = null
		values.isFullSwipe.set(false)
	}

	let position: number
	if (isSwipingBeyondThreshold) {
		let thresholdPos = fullSwipeThreshold * Math.sign(swipeDelta)
		let overshoot = Math.abs(swipeDelta) - fullSwipeThreshold
		position =
			thresholdPos + overshoot * RESISTANCE_FACTOR * Math.sign(swipeDelta)
	} else {
		position = swipeDelta
	}
	values.swipeAmount.set(clamp(-itemWidth, itemWidth, position))
}

function handlePointerUp(
	refs: SwipeRefs,
	values: SwipeValues,
	leftAction: SwipeAction | undefined,
	rightActions: SwipeableListItemProps["rightActions"],
) {
	if (!refs.swipeState.current) return

	let itemWidth = refs.swipeItemWidth.current
	if (!itemWidth) return

	let currentOffset = values.swipeAmount.get()
	let targetOffset = 0

	if (refs.swipeState.current === "horizontal" && Math.abs(currentOffset) > 5) {
		;(refs.didSwipeRef as React.RefObject<boolean>).current = true
		setTimeout(
			() => ((refs.didSwipeRef as React.RefObject<boolean>).current = false),
			100,
		)
	}

	let rightSnapWidth = refs.rightActionsRef.current
		? Number(refs.rightActionsRef.current.dataset.baseWidth || 0) + BUTTON_GAP
		: 0
	let leftSnapWidth = refs.leftActionsRef.current
		? Number(refs.leftActionsRef.current.dataset.baseWidth || 0) + BUTTON_GAP
		: 0

	let snapThreshold = itemWidth * 0.15
	if (Math.abs(currentOffset) > snapThreshold) {
		if (currentOffset > 0 && rightActions) targetOffset = rightSnapWidth
		else if (currentOffset < 0 && leftAction) targetOffset = -leftSnapWidth
	}

	let isFullySwiped = refs.fullSwipeSnapPosition.current
	if (isFullySwiped) {
		let action = isFullySwiped === "right" ? rightActions?.primary : leftAction

		if (action) {
			animate([
				[
					refs.swipeContainerRef.current!,
					{ scaleY: 1.02, scaleX: 0.98, pointerEvents: "none" },
					{ duration: 0.1, ease: "easeOut" },
				],
				[
					refs.swipeContainerRef.current!,
					{ scaleY: 1, scaleX: 1, pointerEvents: "auto" },
					{ duration: 0.4, type: "spring" },
				],
			])
			action.onAction()
		}

		targetOffset = 0
		animate(values.swipeAmount, targetOffset, { ...SPRING_CONFIG, delay: 0.1 })
	} else {
		animate(values.swipeAmount, targetOffset, SPRING_CONFIG)
	}

	;(
		refs.swipeState as React.RefObject<"pending" | "horizontal" | null>
	).current = null
	;(
		refs.fullSwipeSnapPosition as React.RefObject<"left" | "right" | null>
	).current = null
	values.isFullSwipe.set(false)
}
