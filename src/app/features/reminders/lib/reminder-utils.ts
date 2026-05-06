export type ReminderInfo = {
	dueAtDate: string
	deleted: boolean
	done: boolean
}

export function findLatestFutureDate(
	reminders: ReminderInfo[],
	today: string,
): string | undefined {
	let latestDate: string | undefined

	for (let reminder of reminders) {
		if (reminder.deleted || reminder.done) continue
		if (reminder.dueAtDate >= today) {
			if (!latestDate || reminder.dueAtDate > latestDate) {
				latestDate = reminder.dueAtDate
			}
		}
	}

	return latestDate
}
