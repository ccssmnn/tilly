import { expect, type Page } from "@playwright/test"
import { testIds } from "../src/shared/lib/test-ids"

export {
	createReminder,
	listReminders,
	editReminder,
	markReminderDone,
	deleteReminder,
	restoreReminder,
}

async function createReminder(
	page: Page,
	args: { personId: string; text: string; dueAtDate: string },
) {
	await page.goto(`/app/people/${args.personId}?tab=reminders`)
	await page.getByTestId(testIds.reminder.newButton).click()
	await page.getByTestId(testIds.reminder.formTextInput).fill(args.text)
	await page.getByTestId(testIds.reminder.formDueInput).fill(args.dueAtDate)
	await page.getByTestId(testIds.reminder.formSubmit).click()

	await expect
		.poll(() => page.getByTestId(testIds.reminder.formSubmit).isVisible())
		.toBe(false)

	await expect
		.poll(async () => page.getByTestId(testIds.reminder.listItem).count(), {
			timeout: 10_000,
		})
		.toBeGreaterThan(0)

	let items = await listReminders(page, { personId: args.personId })
	let created = items.items[0]
	if (!created) throw new Error("Reminder not visible after create")

	return { ok: true as const, id: created.id, text: args.text }
}

async function listReminders(page: Page, args: { personId: string }) {
	if (!page.url().includes(`/app/people/${args.personId}`)) {
		await page.goto(`/app/people/${args.personId}?tab=reminders`)
	}
	let items = await page
		.getByTestId(testIds.reminder.listItem)
		.evaluateAll(rows =>
			rows.map(row => ({
				id: row.getAttribute("data-reminder-id") ?? "",
				status: row.getAttribute("data-reminder-status") ?? "",
			})),
		)
	return { ok: true as const, count: items.length, items }
}

async function editReminder(
	page: Page,
	args: {
		personId: string
		reminderId: string
		text?: string
		dueAtDate?: string
	},
) {
	let row = page.locator(
		`[data-testid="${testIds.reminder.listItem}"][data-reminder-id="${args.reminderId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.reminder.editButton).click()
	if (args.text !== undefined) {
		await page.getByTestId(testIds.reminder.formTextInput).fill(args.text)
	}
	if (args.dueAtDate !== undefined) {
		await page.getByTestId(testIds.reminder.formDueInput).fill(args.dueAtDate)
	}
	await page.getByTestId(testIds.reminder.formSubmit).click()
	await expect
		.poll(() => page.getByTestId(testIds.reminder.formSubmit).isVisible())
		.toBe(false)

	return { ok: true as const, id: args.reminderId }
}

async function markReminderDone(
	page: Page,
	args: { personId: string; reminderId: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.reminder.listItem}"][data-reminder-id="${args.reminderId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.reminder.doneToggle).click()
	return { ok: true as const, id: args.reminderId }
}

async function deleteReminder(
	page: Page,
	args: { personId: string; reminderId: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.reminder.listItem}"][data-reminder-id="${args.reminderId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.reminder.deleteButton).click()
	return { ok: true as const, id: args.reminderId }
}

async function restoreReminder(
	page: Page,
	args: { personId: string; reminderId: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.reminder.listItem}"][data-reminder-id="${args.reminderId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.reminder.restoreButton).click()
	return { ok: true as const, id: args.reminderId }
}
