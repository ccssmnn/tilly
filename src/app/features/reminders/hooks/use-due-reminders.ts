import { useAccount } from "jazz-tools/react"
import { useEffect } from "react"
import { UserAccount, isDeleted, isDueToday } from "#shared/schema/user"

export { useDueReminders }

function useDueReminders(): number {
	let me = useAccount(UserAccount, {
		resolve: {
			root: {
				people: {
					$each: {
						reminders: { $each: { $onError: "catch" } },
						$onError: "catch",
					},
				},
			},
		},
	})

	let dueReminderCount = 0

	if (me.$isLoaded) {
		for (let person of me.root.people.values()) {
			if (!person?.$isLoaded || isDeleted(person)) continue
			for (let reminder of person.reminders.values()) {
				if (!reminder.$isLoaded) continue
				if (!reminder.done && !isDeleted(reminder) && isDueToday(reminder)) {
					dueReminderCount++
				}
			}
		}
	}

	useEffect(() => {
		if (dueReminderCount > 0) {
			navigator.setAppBadge?.(dueReminderCount)
		} else {
			navigator.clearAppBadge?.()
		}
	}, [dueReminderCount])

	return dueReminderCount
}
