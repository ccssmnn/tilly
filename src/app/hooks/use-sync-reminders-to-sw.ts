import { useAccount } from "jazz-tools/react"
import { useUser } from "@clerk/clerk-react"
import { useEffect, useMemo } from "react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { syncRemindersToServiceWorker } from "#app/lib/service-worker"

export { useSyncRemindersToServiceWorker }

let remindersQuery = {
	root: {
		people: {
			$each: {
				reminders: { $each: true },
			},
		},
	},
} as const

function useSyncRemindersToServiceWorker() {
	let { user } = useUser()
	let me = useAccount(UserAccount, { resolve: remindersQuery })

	let remindersKey = useMemo(() => {
		if (!me.$isLoaded) return null
		let reminders: { id: string; dueAtDate: string }[] = []
		for (let person of me.root.people.values()) {
			if (!person?.reminders || isDeleted(person)) continue
			for (let reminder of person.reminders.values()) {
				if (!reminder || reminder.done || isDeleted(reminder)) continue
				reminders.push({ id: reminder.$jazz.id, dueAtDate: reminder.dueAtDate })
			}
		}
		reminders.sort((a, b) => a.id.localeCompare(b.id))
		return JSON.stringify(reminders)
	}, [me])

	useEffect(() => {
		if (!user?.id || !remindersKey) return
		let reminders = JSON.parse(remindersKey) as {
			id: string
			dueAtDate: string
		}[]
		syncRemindersToServiceWorker(user.id, reminders)
	}, [user?.id, remindersKey])
}
