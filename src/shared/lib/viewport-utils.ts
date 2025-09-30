export { calculateEagerLoadCount }

function calculateEagerLoadCount(): number {
	if (typeof window === "undefined") return 6

	return Math.ceil(window.innerHeight / 96)
}
