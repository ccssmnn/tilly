import { expect, type Page } from "@playwright/test"
import { testIds } from "../src/shared/lib/test-ids"

export { createNote, listNotes, editNote, deleteNote, restoreNote, togglePin }

async function createNote(
	page: Page,
	args: { personId: string; content: string },
) {
	await page.goto(`/app/people/${args.personId}?tab=notes`)
	await page.getByTestId(testIds.note.newButton).click()
	await page.getByTestId(testIds.note.formContentInput).fill(args.content)
	await page.getByTestId(testIds.note.formSubmit).click()

	await expect
		.poll(() => page.getByTestId(testIds.note.formSubmit).isVisible())
		.toBe(false)

	await expect
		.poll(async () => await page.getByTestId(testIds.note.listItem).count(), {
			timeout: 10_000,
		})
		.toBeGreaterThan(0)

	let items = await listNotes(page, { personId: args.personId })
	let created = items.items[0]
	if (!created) throw new Error("Note not visible after create")

	return { ok: true as const, id: created.id, content: args.content }
}

async function listNotes(page: Page, args: { personId: string }) {
	if (!page.url().includes(`/app/people/${args.personId}`)) {
		await page.goto(`/app/people/${args.personId}?tab=notes`)
	}
	let items = await page.getByTestId(testIds.note.listItem).evaluateAll(rows =>
		rows.map(row => ({
			id: row.getAttribute("data-note-id") ?? "",
			status: row.getAttribute("data-note-status") ?? "",
		})),
	)
	return { ok: true as const, count: items.length, items }
}

async function editNote(
	page: Page,
	args: { personId: string; noteId: string; content: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.note.listItem}"][data-note-id="${args.noteId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.note.editButton).click()
	await page.getByTestId(testIds.note.formContentInput).fill(args.content)
	await page.getByTestId(testIds.note.formSubmit).click()

	await expect
		.poll(() => page.getByTestId(testIds.note.formSubmit).isVisible())
		.toBe(false)

	return { ok: true as const, id: args.noteId, content: args.content }
}

async function togglePin(
	page: Page,
	args: { personId: string; noteId: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.note.listItem}"][data-note-id="${args.noteId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.note.pinButton).click()
	return { ok: true as const, id: args.noteId }
}

async function deleteNote(
	page: Page,
	args: { personId: string; noteId: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.note.listItem}"][data-note-id="${args.noteId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.note.deleteButton).click()
	return { ok: true as const, id: args.noteId }
}

async function restoreNote(
	page: Page,
	args: { personId: string; noteId: string },
) {
	let row = page.locator(
		`[data-testid="${testIds.note.listItem}"][data-note-id="${args.noteId}"]`,
	)
	await row.scrollIntoViewIfNeeded()
	await row.click()
	await row.getByTestId(testIds.note.restoreButton).click()
	return { ok: true as const, id: args.noteId }
}
