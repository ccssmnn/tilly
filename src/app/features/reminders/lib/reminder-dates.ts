import { Reminder } from "#shared/schema/user"
import { co } from "jazz-tools"

export { getReferenceDate, getDeletedDate }

function getReferenceDate(reminder: co.loaded<typeof Reminder>) {
	return (
		reminder.updatedAt ||
		reminder.createdAt ||
		new Date(reminder.$jazz.lastUpdatedAt || reminder.$jazz.createdAt)
	)
}

function getDeletedDate(reminder: co.loaded<typeof Reminder>) {
	return reminder.deletedAt ?? getReferenceDate(reminder)
}
