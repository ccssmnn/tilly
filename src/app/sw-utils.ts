// Pure utility functions extracted from sw.ts for testing

export function getTodayStr(): string {
	let today = new Date()
	return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

export function countDueReminders(
	reminders: { dueAtDate: string }[],
	todayStr: string,
): number {
	let count = 0
	for (let r of reminders) {
		if (r.dueAtDate <= todayStr) count++
	}
	return count
}

export function interpolateCount(text: string, count: number): string {
	return text.replace("{count}", String(count))
}
