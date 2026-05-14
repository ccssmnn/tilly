import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { listNotes } from "#shared/tools/note-read"
import { updateNote } from "#shared/tools/note-update"
import { createAccount, seedNote, seedPerson } from "#shared/tools/test-helpers"

describe("listNotes", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns notes across people, hides deleted by default", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedNote(ada, { content: "ada-1" })
		await seedNote(grace, { content: "grace-1" })
		let gone = await seedNote(ada, { content: "gone" })
		await updateNote(owner, {
			personId: ada.$jazz.id,
			noteId: gone.$jazz.id,
			deletedAt: new Date(),
		})

		let result = await listNotes(owner, { includeDeleted: false })
		expect(result.notes.map(n => n.content).sort()).toEqual([
			"ada-1",
			"grace-1",
		])
		expect(result.notes.find(n => n.content === "ada-1")?.person.name).toBe(
			"Ada",
		)
	})

	test("pinned notes appear first", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedNote(ada, { content: "regular-1" })
		await seedNote(ada, { content: "pinned-1", pinned: true })
		await seedNote(ada, { content: "regular-2" })

		let result = await listNotes(owner, { includeDeleted: false })
		expect(result.notes[0]?.content).toBe("pinned-1")
	})

	test("search filters by content, title, person name", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedNote(ada, { content: "needle here" })
		await seedNote(ada, { content: "boring", title: "needle title" })
		await seedNote(grace, { content: "plain" })

		let byContent = await listNotes(owner, {
			searchQuery: "needle here",
			includeDeleted: false,
		})
		expect(byContent.filteredCount).toBe(1)

		let byTitle = await listNotes(owner, {
			searchQuery: "needle title",
			includeDeleted: false,
		})
		expect(byTitle.filteredCount).toBe(1)

		let byPerson = await listNotes(owner, {
			searchQuery: "grace",
			includeDeleted: false,
		})
		expect(byPerson.notes.every(n => n.person.name === "Grace")).toBe(true)
	})

	test("includeDeleted appends deleted notes at the end", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedNote(ada, { content: "alive" })
		let dead = await seedNote(ada, { content: "dead" })
		await updateNote(owner, {
			personId: ada.$jazz.id,
			noteId: dead.$jazz.id,
			deletedAt: new Date(),
		})

		let result = await listNotes(owner, { includeDeleted: true })
		expect(result.notes.map(n => n.content)).toEqual(["alive", "dead"])
		expect(result.notes[1]?.deleted).toBe(true)
	})
})
