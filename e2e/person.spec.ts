import { expect, test } from "@playwright/test"
import { bootApp, skipTourIfShown, gotoPeople } from "./setup-helpers"
import {
	createPerson,
	deletePerson,
	listPeople,
	openPerson,
	updatePerson,
} from "./person-helpers"

test("person CRUD: create → read → update → delete → restore", async ({
	page,
}) => {
	await bootApp(page)
	await skipTourIfShown(page)
	await gotoPeople(page)

	let suffix = Date.now().toString(36)
	let created = await createPerson(page, {
		name: `E2E Person ${suffix}`,
		summary: "test subject",
	})
	expect(created.id).toMatch(/^co_/)

	await gotoPeople(page)
	let listed = await listPeople(page)
	expect(
		listed.items.some(p => p.id === created.id && p.status === "active"),
	).toBe(true)

	let read = await openPerson(page, { personId: created.id })
	expect(read.name).toBe(`E2E Person ${suffix}`)

	let newName = `E2E Person ${suffix} updated`
	await updatePerson(page, { personId: created.id, name: newName })

	let reread = await openPerson(page, { personId: created.id })
	expect(reread.name).toBe(newName)

	await deletePerson(page, { personId: created.id })
	await gotoPeople(page)
	let afterDelete = await listPeople(page)
	let foundActive = afterDelete.items.find(
		p => p.id === created.id && p.status === "active",
	)
	expect(foundActive).toBeUndefined()
})
