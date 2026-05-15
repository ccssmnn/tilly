import { expect, test } from "@playwright/test"
import { bootApp, skipTourIfShown, gotoPeople } from "./setup-helpers"
import { createPerson } from "./person-helpers"
import {
	createReminder,
	deleteReminder,
	editReminder,
	listReminders,
	markReminderDone,
} from "./reminder-helpers"

test("reminder CRUD on a person: create → edit → delete", async ({ page }) => {
	await bootApp(page)
	await skipTourIfShown(page)
	await gotoPeople(page)

	let suffix = Date.now().toString(36)
	let person = await createPerson(page, { name: `Reminder Owner ${suffix}` })

	let tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	let due = tomorrow.toISOString().slice(0, 10)

	let reminder = await createReminder(page, {
		personId: person.id,
		text: "call back later",
		dueAtDate: due,
	})
	expect(reminder.id).toMatch(/^co_/)

	await editReminder(page, {
		personId: person.id,
		reminderId: reminder.id,
		text: "call back tomorrow",
	})

	let active = await listReminders(page, { personId: person.id })
	expect(
		active.items.some(r => r.id === reminder.id && r.status === "active"),
	).toBe(true)

	await deleteReminder(page, {
		personId: person.id,
		reminderId: reminder.id,
	})

	let final = await listReminders(page, { personId: person.id })
	let stillActive = final.items.find(
		r => r.id === reminder.id && r.status === "active",
	)
	expect(stillActive).toBeUndefined()
})

test("reminder mark done: create → mark done removes from active", async ({
	page,
}) => {
	await bootApp(page)
	await skipTourIfShown(page)
	await gotoPeople(page)

	let suffix = Date.now().toString(36)
	let person = await createPerson(page, {
		name: `Reminder DoneOwner ${suffix}`,
	})

	let tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	let due = tomorrow.toISOString().slice(0, 10)

	let reminder = await createReminder(page, {
		personId: person.id,
		text: "do the thing",
		dueAtDate: due,
	})

	await markReminderDone(page, {
		personId: person.id,
		reminderId: reminder.id,
	})

	let final = await listReminders(page, { personId: person.id })
	let stillActive = final.items.find(
		r => r.id === reminder.id && r.status === "active",
	)
	expect(stillActive).toBeUndefined()
})
