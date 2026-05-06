import { useState, useEffect } from "react"

export type Direction = "left" | "right" | undefined

export function useTourCarousel(stepCount: number) {
	let [currentStep, setCurrentStep] = useState(0)
	let [direction, setDirection] = useState<Direction>()

	function next() {
		setDirection("right")
		setTimeout(() => setCurrentStep(s => Math.min(s + 1, stepCount - 1)), 10)
	}

	function prev() {
		setDirection("left")
		setCurrentStep(s => Math.max(s - 1, 0))
	}

	function goTo(index: number) {
		setDirection(index > currentStep ? "right" : "left")
		setTimeout(() => setCurrentStep(index), 10)
	}

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowRight") next()
			else if (event.key === "ArrowLeft") prev()
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	})

	function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
		let swipeThreshold = 50
		if (info.offset.x > swipeThreshold) prev()
		else if (info.offset.x < -swipeThreshold) next()
	}

	return {
		currentStep,
		setCurrentStep,
		direction,
		next,
		prev,
		goTo,
		handleDragEnd,
		isFirst: currentStep === 0,
		isLast: currentStep === stepCount - 1,
	}
}
