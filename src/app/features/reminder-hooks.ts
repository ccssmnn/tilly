import {
	Person,
	Reminder,
	isDeleted,
	isPermanentlyDeleted,
	UserAccount,
} from "#shared/schema/user"
import { useAccount, useCoState } from "jazz-tools/react-core"
import { co, type ResolveQuery } from "jazz-tools"
import {
	filterReminders,
	filterPersonReminders,
	type RemindersFilterOptions,
	type PersonRemindersFilterOptions,
} from "#app/features/reminder-filters"

export {
	useReminders,
	usePersonReminders,
	type RemindersLoadedAccount,
	type PersonRemindersLoadedPerson,
	type ReminderPair,
}

let remindersResolve = {
	root: {
		people: {
			$each: {
				reminders: { $each: true },
				inactiveReminders: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

let personRemindersResolve = {
	reminders: { $each: true },
	inactiveReminders: { $each: true },
} as const satisfies ResolveQuery<typeof Person>

type RemindersLoadedAccount = co.loaded<
	typeof UserAccount,
	typeof remindersResolve
>
type PersonRemindersLoadedPerson = co.loaded<
	typeof Person,
	typeof personRemindersResolve
>

type ReminderPair = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
}

function useReminders(
	searchQuery: string,
	defaultAccount?: RemindersLoadedAccount,
	options?: RemindersFilterOptions,
): { reminders: ReminderPair[]; total: number } {
	let account = useAccount(UserAccount, {
		resolve: remindersResolve,
	})

	let loadedAccount = account.$isLoaded ? account : defaultAccount
	let people =
		loadedAccount?.root.people
			.filter(p => p.$isLoaded)
			.filter(p => !isDeleted(p) && !isPermanentlyDeleted(p)) ?? []

	let allReminderPairs: ReminderPair[] = []

	for (let person of people) {
		for (let reminder of person.reminders.values()) {
			if (isPermanentlyDeleted(reminder)) continue
			allReminderPairs.push({ reminder, person })
		}

		if (person.inactiveReminders?.$isLoaded) {
			for (let reminder of person.inactiveReminders.values()) {
				if (!reminder || isPermanentlyDeleted(reminder)) continue
				allReminderPairs.push({ reminder, person })
			}
		}
	}

	return filterReminders(allReminderPairs, searchQuery, options)
}

function usePersonReminders(
	personId: string,
	searchQuery: string,
	defaultPerson?: PersonRemindersLoadedPerson,
	options?: PersonRemindersFilterOptions,
): co.loaded<typeof Reminder>[] {
	let person = useCoState(Person, personId, {
		resolve: personRemindersResolve,
	})

	let loadedPerson = person.$isLoaded ? person : defaultPerson

	let allReminders = [
		...(loadedPerson?.reminders?.filter(r => !isPermanentlyDeleted(r)) ?? []),
		...(loadedPerson?.inactiveReminders?.filter(
			r => !isPermanentlyDeleted(r),
		) ?? []),
	]

	return filterPersonReminders(allReminders, searchQuery, options)
}
