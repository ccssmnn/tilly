import {
	animate,
	clamp,
	motion,
	useMotionValue,
	useTransform,
	useReducedMotion,
	type MotionValue,
} from "motion/react"
import {
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
	type ReactNode,
} from "react"
import { useWebHaptics } from "web-haptics/react"
import { cn } from "#app/lib/utils"
import { buttonVariants } from "#shared/ui/button"

export { SwipeableListItem }
export type { SwipeAction, SwipeableListItemProps }

type SwipeAction = {
	icon: ReactNode
	label: ReactNode
	variant: "destructive" | "primary" | "success" | "warning"
	onAction: () => void | Promise<unknown>
}

type SwipeableListItemProps = {
	children: ReactNode
	rightAction?: SwipeAction
	leftAction?: SwipeAction
	onClick?: () => void
}

function SwipeableListItem({
	children,
	rightAction,
	leftAction,
	onClick,
}: SwipeableListItemProps) {
	let prefersReducedMotion = useReducedMotion()

	let triggerFeedback = useSwipeHighlightFeedback()
	let containerRef = useRef<HTMLDivElement>(null)
	let itemRef = useRef<HTMLDivElement>(null)
	let rightActionsRef = useRef<HTMLDivElement>(null)
	let leftActionsRef = useRef<HTMLDivElement>(null)
	let itemWidth = useRef(0)
	let startX = useRef(0)
	let startY = useRef(0)
	let startOffset = useRef(0)
	let fullSwipeSnap = useRef<"left" | "right" | null>(null)
	let gestureState = useRef<"pending" | "horizontal" | null>(null)
	let didSwipe = useRef(false)

	let swipeAmount = useMotionValue(0)
	let isFullSwipe = useMotionValue(false)
	let wasHighlighted = useRef(false)

	let hasRight = !!rightAction
	let hasLeft = !!leftAction

	let [isFull, setIsFull] = useState(false)
	let [isOpen, setIsOpen] = useState(false)

	let { measureRef: rightMeasureRef, width: rightWidth } = useLabelWidth(
		rightAction?.label,
	)
	let { measureRef: leftMeasureRef, width: leftWidth } = useLabelWidth(
		leftAction?.label,
	)

	let rightBaseWidth = hasRight ? rightWidth + ACTION_GAP * 2 : 0
	let leftBaseWidth = hasLeft ? leftWidth + ACTION_GAP * 2 : 0

	let rightAppear = useAppearTransform(
		swipeAmount,
		true,
		ACTION_GAP,
		rightWidth,
	)
	let leftAppear = useAppearTransform(swipeAmount, false, ACTION_GAP, leftWidth)

	let rightStretchThreshold = rightWidth + ACTION_GAP * 2
	let leftStretchThreshold = leftWidth + ACTION_GAP * 2
	let rightButtonWidth = useStretchTransform(
		swipeAmount,
		true,
		rightStretchThreshold,
		rightWidth,
	)
	let leftButtonWidth = useStretchTransform(
		swipeAmount,
		false,
		leftStretchThreshold,
		leftWidth,
	)

	let id = useId()
	let reset = useCallback(() => {
		let animationConfig = prefersReducedMotion ? { duration: 0 } : SPRING
		animate(swipeAmount, 0, animationConfig)
		setIsOpen(false)
	}, [swipeAmount, prefersReducedMotion])

	useEffect(() => {
		swipeAmount.jump(0)
		fullSwipeSnap.current = null
	}, [swipeAmount])

	useEffect(() => {
		return isFullSwipe.on("change", highlighted => {
			if (highlighted === wasHighlighted.current) return
			wasHighlighted.current = highlighted
			triggerFeedback(highlighted)
		})
	}, [isFullSwipe, triggerFeedback])

	useEffect(() => {
		return isFullSwipe.on("change", setIsFull)
	}, [isFullSwipe])

	useEffect(() => {
		function handleResize() {
			let w = itemRef.current?.getBoundingClientRect().width
			if (!w) return
			itemWidth.current = w
			swipeAmount.jump(0)
		}
		handleResize()
		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [swipeAmount])

	useEffect(() => {
		if (rightActionsRef.current)
			rightActionsRef.current.dataset.baseWidth = String(rightBaseWidth)
	}, [rightBaseWidth])
	useEffect(() => {
		if (leftActionsRef.current)
			leftActionsRef.current.dataset.baseWidth = String(leftBaseWidth)
	}, [leftBaseWidth])

	let rightPointerEvents = useTransform(swipeAmount, v =>
		v > 5 ? "auto" : "none",
	)
	let leftPointerEvents = useTransform(swipeAmount, v =>
		v < -5 ? "auto" : "none",
	)

	if (!hasRight && !hasLeft) {
		return <div>{children}</div>
	}

	return (
		<motion.div
			ref={containerRef}
			className="relative -mx-3 overflow-hidden md:mx-0"
			style={{ touchAction: "pan-y" }}
			onPointerDown={e => {
				if (e.pointerType !== "touch") return
				if ((e.target as HTMLElement)?.closest("[data-swipe-action]")) return

				if (activeSwipeId !== id) closeActiveSwipe()

				gestureState.current = "pending"
				startX.current = e.clientX
				startY.current = e.clientY
				startOffset.current = swipeAmount.get()

				let el = e.currentTarget

				function onMove(ev: PointerEvent) {
					if (!gestureState.current) return
					let w = itemWidth.current
					if (!w) return

					let dx = ev.clientX - startX.current
					let dy = ev.clientY - startY.current

					if (gestureState.current === "pending") {
						if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return
						if (Math.abs(dx) < Math.abs(dy) * 2) {
							gestureState.current = null
							let animationConfig = prefersReducedMotion
								? { duration: 0 }
								: SPRING
							animate(swipeAmount, startOffset.current, animationConfig)
							return
						}
						gestureState.current = "horizontal"
					}

					let delta = dx + startOffset.current
					if (!hasRight && delta > 0) delta = 0
					if (!hasLeft && delta < 0) delta = 0

					let threshold = w * FULL_SWIPE_THRESHOLD
					let beyondThreshold = Math.abs(delta) > threshold

					if (beyondThreshold) {
						if (!fullSwipeSnap.current) {
							fullSwipeSnap.current = delta < 0 ? "left" : "right"
							isFullSwipe.set(true)
						}
					} else if (fullSwipeSnap.current) {
						fullSwipeSnap.current = null
						isFullSwipe.set(false)
					}

					let pos: number
					if (beyondThreshold) {
						let tp = threshold * Math.sign(delta)
						let overshoot = Math.abs(delta) - threshold
						pos = tp + overshoot * RESISTANCE * Math.sign(delta)
					} else {
						pos = delta
					}
					swipeAmount.set(clamp(-w, w, pos))
				}

				function onEnd() {
					if (!gestureState.current) return
					let w = itemWidth.current
					if (!w) return

					let current = swipeAmount.get()
					let target = 0

					if (gestureState.current === "horizontal" && Math.abs(current) > 5) {
						didSwipe.current = true
						setTimeout(() => {
							didSwipe.current = false
						}, 100)
					}

					let rightSnap = rightActionsRef.current
						? Number(rightActionsRef.current.dataset.baseWidth || 0) +
							ACTION_GAP
						: 0
					let leftSnap = leftActionsRef.current
						? Number(leftActionsRef.current.dataset.baseWidth || 0) + ACTION_GAP
						: 0

					let snapThreshold = w * 0.15
					if (Math.abs(current) > snapThreshold) {
						if (current > 0 && hasRight) target = rightSnap
						else if (current < 0 && hasLeft) target = -leftSnap
					}

					if (fullSwipeSnap.current) {
						let actionContainer =
							fullSwipeSnap.current === "right"
								? rightActionsRef.current
								: leftActionsRef.current
						let primaryButton = actionContainer?.querySelector(
							"[data-swipe-action]",
						) as HTMLButtonElement | null
						if (primaryButton) {
							if (prefersReducedMotion) {
								primaryButton.click()
							} else {
								animate([
									[
										containerRef.current!,
										{ scaleY: 1.02, scaleX: 0.98, pointerEvents: "none" },
										{ duration: 0.1, ease: "easeOut" },
									],
									[
										containerRef.current!,
										{ scaleY: 1, scaleX: 1, pointerEvents: "auto" },
										{ duration: 0.4, type: "spring" },
									],
								])
								primaryButton.click()
							}
						}
						target = 0
						let animationConfig = prefersReducedMotion
							? { duration: 0 }
							: { ...SPRING, delay: 0.15 }
						animate(swipeAmount, target, animationConfig)
					} else {
						let animationConfig = prefersReducedMotion
							? { duration: 0 }
							: SPRING
						animate(swipeAmount, target, animationConfig)
					}

					if (target !== 0) {
						activeSwipeId = id
						closeActiveSwipe = reset
						setIsOpen(true)
					} else {
						setIsOpen(false)
					}

					gestureState.current = null
					fullSwipeSnap.current = null
					isFullSwipe.set(false)
				}

				el.setPointerCapture(e.pointerId)
				el.addEventListener("pointermove", onMove)
				el.addEventListener("pointerup", onEnd)
				el.addEventListener("pointercancel", onEnd)
				el.addEventListener(
					"lostpointercapture",
					() => {
						el.removeEventListener("pointermove", onMove)
						el.removeEventListener("pointerup", onEnd)
						el.removeEventListener("pointercancel", onEnd)
					},
					{ once: true },
				)
			}}
			onClickCapture={e => {
				if (didSwipe.current) {
					e.preventDefault()
					e.stopPropagation()
				}
			}}
		>
			<motion.div
				ref={itemRef}
				className="bg-background relative px-3 md:px-0"
				style={{ x: swipeAmount }}
				onClick={onClick}
			>
				{children}
			</motion.div>

			{rightAction && (
				<motion.div
					ref={rightActionsRef}
					className="absolute inset-y-0 left-0 flex items-center gap-1.5 px-1.5 select-none"
					style={{ pointerEvents: rightPointerEvents }}
				>
					<span
						ref={rightMeasureRef}
						className="pointer-events-none invisible absolute text-[10px] leading-tight whitespace-nowrap"
					>
						{rightAction.label}
					</span>

					<motion.div
						className="flex flex-col items-center justify-center gap-0.5"
						style={{
							scale: rightAppear.scale,
							opacity: rightAppear.opacity,
						}}
					>
						<motion.button
							type="button"
							data-swipe-action
							tabIndex={isOpen ? 0 : -1}
							onClick={() => {
								rightAction.onAction()
								reset()
							}}
							className={cn(
								buttonVariants({ variant: "secondary", size: "icon" }),
								"min-w-0 transition-colors duration-150 [&_svg:not([class*='size-'])]:size-5",
								isFull
									? cn(BG_COLOR_MAP[rightAction.variant], "text-white")
									: TEXT_COLOR_MAP[rightAction.variant],
							)}
							style={{
								width: rightButtonWidth,
								height: BUTTON_HEIGHT,
								borderRadius: BUTTON_HEIGHT / 2,
							}}
						>
							<span className="sr-only">{rightAction.label}</span>
							{rightAction.icon}
						</motion.button>
						<span
							aria-hidden
							className="text-muted-foreground text-[10px] leading-tight whitespace-nowrap"
						>
							{rightAction.label}
						</span>
					</motion.div>
				</motion.div>
			)}

			{leftAction && (
				<motion.div
					ref={leftActionsRef}
					className="absolute inset-y-0 right-0 flex flex-row-reverse items-center gap-1.5 px-1.5 select-none"
					style={{ pointerEvents: leftPointerEvents }}
				>
					<span
						ref={leftMeasureRef}
						className="pointer-events-none invisible absolute text-[10px] leading-tight whitespace-nowrap"
					>
						{leftAction.label}
					</span>

					<motion.div
						className="flex flex-col items-center justify-center gap-0.5"
						style={{
							scale: leftAppear.scale,
							opacity: leftAppear.opacity,
						}}
					>
						<motion.button
							type="button"
							data-swipe-action
							tabIndex={isOpen ? 0 : -1}
							onClick={() => {
								leftAction.onAction()
								reset()
							}}
							className={cn(
								buttonVariants({ variant: "secondary", size: "icon" }),
								"min-w-0 transition-colors duration-150 [&_svg:not([class*='size-'])]:size-5",
								isFull
									? cn(BG_COLOR_MAP[leftAction.variant], "text-white")
									: TEXT_COLOR_MAP[leftAction.variant],
							)}
							style={{
								width: leftButtonWidth,
								height: BUTTON_HEIGHT,
								borderRadius: BUTTON_HEIGHT / 2,
							}}
						>
							<span className="sr-only">{leftAction.label}</span>
							{leftAction.icon}
						</motion.button>
						<span
							aria-hidden
							className="text-muted-foreground text-[10px] leading-tight whitespace-nowrap"
						>
							{leftAction.label}
						</span>
					</motion.div>
				</motion.div>
			)}
		</motion.div>
	)
}

// -- Hooks --

function useLabelWidth(label: ReactNode) {
	let measureRef = useRef<HTMLSpanElement>(null)
	let [width, setWidth] = useState(BUTTON_HEIGHT)

	useEffect(() => {
		if (measureRef.current) {
			setWidth(Math.max(BUTTON_HEIGHT, measureRef.current.offsetWidth))
		}
	}, [label])

	return { measureRef, width }
}

function useAppearTransform(
	swipeAmount: MotionValue<number>,
	isLeft: boolean,
	threshold: number,
	targetWidth: number,
) {
	let minSpace = threshold + targetWidth * APPEAR_INITIAL_SCALE
	let animationRange = targetWidth * (1 - APPEAR_INITIAL_SCALE)

	let progress = useTransform(swipeAmount, value => {
		if (isLeft && value <= 0) return 0
		if (!isLeft && value >= 0) return 0
		let absValue = Math.abs(value)
		if (absValue < minSpace) return 0
		return clamp(0, 1, (absValue - minSpace) / animationRange)
	})

	let scale = useTransform(
		progress,
		p => APPEAR_INITIAL_SCALE + p * (1 - APPEAR_INITIAL_SCALE),
	)
	let opacity = progress

	return { scale, opacity }
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

function useSwipeHighlightFeedback() {
	let { trigger: triggerHaptic } = useWebHaptics()
	let audioCtx = useRef<AudioContext | null>(null)

	return useCallback(
		(highlighted: boolean) => {
			triggerHaptic()
			playSwipeSound(audioCtx, highlighted)
		},
		[triggerHaptic],
	)
}

// -- Audio --

function playSwipeSound(
	audioCtxRef: React.RefObject<AudioContext | null>,
	highlighted: boolean,
) {
	if (typeof window === "undefined") return

	let Ctor =
		window.AudioContext ||
		(window as Window & { webkitAudioContext?: new () => AudioContext })
			.webkitAudioContext
	if (!Ctor) return

	let ctx = audioCtxRef.current ?? new Ctor()
	audioCtxRef.current = ctx
	if (ctx.state === "suspended") void ctx.resume()

	let now = ctx.currentTime
	let dur = 0.045

	let osc = ctx.createOscillator()
	let oscGain = ctx.createGain()
	osc.type = "triangle"
	osc.frequency.setValueAtTime(highlighted ? 420 : 340, now)
	osc.frequency.exponentialRampToValueAtTime(highlighted ? 260 : 220, now + dur)
	oscGain.gain.setValueAtTime(0.0001, now)
	oscGain.gain.exponentialRampToValueAtTime(0.13, now + 0.003)
	oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur)
	osc.connect(oscGain)

	let frames = Math.max(1, Math.floor(ctx.sampleRate * 0.025))
	let buf = ctx.createBuffer(1, frames, ctx.sampleRate)
	let ch = buf.getChannelData(0)
	for (let i = 0; i < frames; i++)
		ch[i] = (Math.random() * 2 - 1) * (1 - i / frames)

	let noise = ctx.createBufferSource()
	let filter = ctx.createBiquadFilter()
	let noiseGain = ctx.createGain()
	noise.buffer = buf
	filter.type = "bandpass"
	filter.frequency.setValueAtTime(highlighted ? 2100 : 1700, now)
	filter.Q.value = 2.4
	noiseGain.gain.setValueAtTime(0.0001, now)
	noiseGain.gain.exponentialRampToValueAtTime(0.05, now + 0.001)
	noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02)
	noise.connect(filter)
	filter.connect(noiseGain)

	let out = ctx.createGain()
	out.gain.value = 0.5
	oscGain.connect(out)
	noiseGain.connect(out)
	out.connect(ctx.destination)

	osc.start(now)
	osc.stop(now + dur)
	noise.start(now)
	noise.stop(now + 0.025)
}

// -- Constants --

let BG_COLOR_MAP = {
	destructive: "bg-destructive",
	primary: "bg-primary",
	success: "bg-success",
	warning: "bg-warning",
} as const

let TEXT_COLOR_MAP = {
	destructive: "text-destructive",
	primary: "text-primary",
	success: "text-success",
	warning: "text-warning",
} as const

let BUTTON_HEIGHT = 52
let ACTION_GAP = 6
let SPRING = { type: "spring", stiffness: 500, damping: 35 } as const
let FULL_SWIPE_THRESHOLD = 0.5
let RESISTANCE = 0.3
let APPEAR_INITIAL_SCALE = 0.3

let activeSwipeId: string | null = null
let closeActiveSwipe = () => {}
