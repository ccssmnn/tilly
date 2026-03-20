export { logStep }

function getElapsed(startTime: number): number {
	return Math.round(performance.now() - startTime)
}

function logStep(
	step: string,
	options: { requestStartTime: number; userId: string },
) {
	let elapsed = getElapsed(options.requestStartTime)
	let timeStr = elapsed > 500 ? `\x1b[31m+${elapsed}ms\x1b[0m` : `+${elapsed}ms`
	let prefix = `[Chat] ${options.userId} | ${timeStr}`
	if (elapsed > 500) {
		console.warn(`${prefix} | ${step}`)
	} else {
		console.log(`${prefix} | ${step}`)
	}
}
