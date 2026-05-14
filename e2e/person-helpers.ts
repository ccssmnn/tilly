import { expect, type Page } from "@playwright/test"
import { testIds } from "../src/shared/lib/test-ids"

export {
	createPerson,
	listPeople,
	openPerson,
	updatePerson,
	deletePerson,
	restorePerson,
}

async function createPerson(
	page: Page,
	args: { name: string; summary?: string },
) {
	await page.getByTestId(testIds.person.newButton).first().click()
	await page.getByTestId(testIds.person.formNameInput).fill(args.name)
	if (args.summary !== undefined) {
		await page.getByTestId(testIds.person.formSummaryInput).fill(args.summary)
	}
	await page.getByTestId(testIds.person.formSubmit).click()

	await expect.poll(() => page.url()).toMatch(/\/people\/co_[^/]+/)

	let id = parsePersonIdFromUrl(page.url())
	if (!id) throw new Error(`Could not parse person id from ${page.url()}`)

	return { ok: true as const, id, name: args.name, summary: args.summary }
}

async function listPeople(page: Page) {
	let items = await page
		.getByTestId(testIds.person.listItem)
		.evaluateAll(rows => {
			return rows.map(row => ({
				id: row.getAttribute("data-person-id") ?? "",
				status: row.getAttribute("data-person-status") ?? "",
			}))
		})

	return { ok: true as const, count: items.length, items }
}

async function openPerson(page: Page, args: { personId: string }) {
	await page.goto(`/app/people/${args.personId}`)
	await expect(page.getByTestId(testIds.person.detailName)).toBeVisible()

	let name = await page.getByTestId(testIds.person.detailName).innerText()
	return { ok: true as const, id: args.personId, name }
}

async function updatePerson(
	page: Page,
	args: { personId: string; name?: string; summary?: string },
) {
	await page.goto(`/app/people/${args.personId}`)
	await page.getByTestId(testIds.person.actionsTrigger).click()
	await page.getByTestId(testIds.person.editButton).click()

	if (args.name !== undefined) {
		await page.getByTestId(testIds.person.formNameInput).fill(args.name)
	}
	if (args.summary !== undefined) {
		await page.getByTestId(testIds.person.formSummaryInput).fill(args.summary)
	}
	await page.getByTestId(testIds.person.formSubmit).click()

	await expect
		.poll(() => page.getByTestId(testIds.person.formSubmit).isVisible())
		.toBe(false)

	return { ok: true as const, id: args.personId }
}

async function deletePerson(page: Page, args: { personId: string }) {
	await page.goto(`/app/people/${args.personId}`)
	await page.getByTestId(testIds.person.actionsTrigger).click()
	await page.getByTestId(testIds.person.deleteButton).click()
	await page.getByTestId(testIds.person.deleteConfirmButton).click()

	return { ok: true as const, id: args.personId }
}

async function restorePerson(page: Page, args: { personId: string }) {
	await page.goto("/app/people")
	let row = page.locator(
		`[data-testid="${testIds.person.listItem}"][data-person-id="${args.personId}"]`,
	)
	let visible = await row.isVisible({ timeout: 2_000 }).catch(() => false)
	if (!visible) {
		throw new Error(
			`Deleted person ${args.personId} not visible — is the deleted-filter active?`,
		)
	}
	await row.click()
	await page.getByTestId(testIds.person.restoreButton).click()

	return { ok: true as const, id: args.personId }
}

function parsePersonIdFromUrl(url: string) {
	let match = url.match(/\/people\/(co_[^/?#]+)/)
	return match?.[1] ?? null
}
