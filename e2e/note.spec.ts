import { expect, test } from "@playwright/test"
import { bootApp, skipTourIfShown, gotoPeople } from "./setup-helpers"
import { createPerson } from "./person-helpers"
import {
	createNote,
	deleteNote,
	editNote,
	listNotes,
	togglePin,
} from "./note-helpers"

test("note CRUD on a person: create → edit → pin → delete", async ({
	page,
}) => {
	await bootApp(page)
	await skipTourIfShown(page)
	await gotoPeople(page)

	let suffix = Date.now().toString(36)
	let person = await createPerson(page, { name: `Note Owner ${suffix}` })

	let note = await createNote(page, {
		personId: person.id,
		content: "first note content",
	})
	expect(note.id).toMatch(/^co_/)

	let edited = await editNote(page, {
		personId: person.id,
		noteId: note.id,
		content: "edited content",
	})
	expect(edited.content).toBe("edited content")

	await togglePin(page, { personId: person.id, noteId: note.id })

	let beforeDelete = await listNotes(page, { personId: person.id })
	expect(
		beforeDelete.items.some(n => n.id === note.id && n.status === "active"),
	).toBe(true)

	await deleteNote(page, { personId: person.id, noteId: note.id })

	let afterDelete = await listNotes(page, { personId: person.id })
	let stillActive = afterDelete.items.find(
		n => n.id === note.id && n.status === "active",
	)
	expect(stillActive).toBeUndefined()
})
