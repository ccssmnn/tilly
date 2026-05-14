import { type Page } from "@playwright/test"
import { testIds } from "../src/shared/lib/test-ids"

export { bootApp, skipTourIfShown, gotoPeople }

async function bootApp(page: Page) {
	await page.goto("/app/")
	await page.waitForLoadState("networkidle")
}

async function skipTourIfShown(page: Page) {
	let skip = page.getByTestId(testIds.tour.skipButton)
	if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) {
		await skip.click()
		await page.waitForLoadState("networkidle")
	}
}

async function gotoPeople(page: Page) {
	await page.goto("/app/people")
	await page.waitForLoadState("networkidle")
}
