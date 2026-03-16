import {
	isDueToday,
	isDeleted,
	Person as PersonSchema,
	sortByUpdatedAt,
} from "#shared/schema/user"
import type { co } from "jazz-tools"
import type { useIntl } from "#shared/intl"

export { getDueReminders, getStarterPrompts }
export type { Person, StarterPrompt }

type Person = co.loaded<typeof PersonSchema, { reminders: { $each: true } }>

type StarterPrompt = {
	key: string
	text: string
}

function getDueReminders(people: Person[]) {
	let reminders = []
	for (let person of people) {
		for (let reminder of person.reminders.values()) {
			if (!reminder.done && !isDeleted(reminder) && isDueToday(reminder)) {
				reminders.push({ reminder, person })
			}
		}
	}
	return reminders
}

function getStarterPrompts(
	people: Person[],
	t: ReturnType<typeof useIntl>,
): StarterPrompt[] {
	if (people.length === 0) {
		return [
			{
				key: "note",
				text: t("assistant.emptyState.starter.note", { name: "someone" }),
			},
			{
				key: "reminder",
				text: t("assistant.emptyState.starter.reminder", { name: "someone" }),
			},
			{
				key: "person",
				text: t("assistant.emptyState.starter.person"),
			},
		]
	}

	let recentPeople = sortByUpdatedAt(people).slice(0, 5)
	let randomPerson =
		recentPeople[Math.floor(Math.random() * recentPeople.length)]
	let hasReminders = recentPeople.some(
		person => person.reminders && person.reminders.length > 0,
	)

	if (!hasReminders) {
		return [
			{
				key: "note",
				text: t("assistant.emptyState.starter.note", {
					name: randomPerson.name,
				}),
			},
			{
				key: "reminder",
				text: t("assistant.emptyState.starter.reminder", {
					name: randomPerson.name,
				}),
			},
			{
				key: "talkAbout",
				text: t("assistant.emptyState.starter.talkAbout", {
					name: randomPerson.name,
				}),
			},
		]
	}

	let dueReminders = getDueReminders(people)

	let followUpPrompt: StarterPrompt
	if (dueReminders.length === 1) {
		followUpPrompt = {
			key: "followup",
			text: t("assistant.emptyState.starter.followUp.single", {
				name: dueReminders[0].person.name,
			}),
		}
	} else if (dueReminders.length > 1) {
		followUpPrompt = {
			key: "followup",
			text: t("assistant.emptyState.starter.followUp.multiple"),
		}
	} else {
		followUpPrompt = {
			key: "followup",
			text: t("assistant.emptyState.starter.followUp.none", {
				name: randomPerson.name,
			}),
		}
	}

	return [
		{
			key: "note",
			text: t("assistant.emptyState.starter.note", { name: randomPerson.name }),
		},
		{
			key: "reminder",
			text: t("assistant.emptyState.starter.reminder", {
				name: randomPerson.name,
			}),
		},
		followUpPrompt,
	]
}
