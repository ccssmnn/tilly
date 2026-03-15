import { useReducedMotion as useFramerReducedMotion } from "motion/react"

export { useReducedMotion }

function useReducedMotion(): boolean {
	let shouldReduceMotion = useFramerReducedMotion()
	return shouldReduceMotion ?? false
}
