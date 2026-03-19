export { isStaleRef }

let STALE_THRESHOLD_DAYS = 30

function isStaleRef(
	lastSyncedAt: Date,
	latestReminderDueDate: string | undefined,
	now: Date = new Date(),
): boolean {
	let staleThreshold = new Date(now)
	staleThreshold.setDate(staleThreshold.getDate() - STALE_THRESHOLD_DAYS)

	// Keep if app was opened recently
	if (lastSyncedAt >= staleThreshold) return false

	// Keep if there's a reminder today or in the future
	if (latestReminderDueDate) {
		let todayStr = now.toISOString().slice(0, 10)
		if (latestReminderDueDate >= todayStr) return false
	}

	return true
}
