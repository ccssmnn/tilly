// Pure utility functions extracted from sw.ts for testing

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
