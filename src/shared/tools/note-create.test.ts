import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Note, UserAccount } from "#shared/schema/user"
import { createNote } from "#shared/tools/note-create"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"

describe("createNote", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("attaches a note to the person's notes list", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createNote(owner, {
			personId: person.$jazz.id,
			content: "first note",
		})

		expect(result.operation).toBe("create")
		expect(result.current.personId).toBe(person.$jazz.id)
		expect(result.current.content).toBe("first note")
		expect(result.current.pinned).toBe(false)

		let loaded = await person.$jazz.ensureLoaded({
			resolve: { notes: { $each: true } },
		})
		expect(loaded.notes.length).toBe(1)
		expect(loaded.notes[0]?.content).toBe("first note")
		expect(loaded.notes[0]?.$jazz.id).toBe(result.current.noteId)
	})

	test("content survives a reload via Note.load", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createNote(owner, {
			personId: person.$jazz.id,
			content: "persisted",
			pinned: true,
			title: "T",
		})

		let reloaded = await Note.load(result.current.noteId)
		expect(reloaded?.$isLoaded).toBe(true)
		if (!reloaded?.$isLoaded) return
		expect(reloaded.content).toBe("persisted")
		expect(reloaded.pinned).toBe(true)
		expect(reloaded.title).toBe("T")
	})

	test("bumps the person's updatedAt", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let before = person.updatedAt.getTime()

		await new Promise(r => setTimeout(r, 5))
		await createNote(owner, {
			personId: person.$jazz.id,
			content: "x",
		})

		expect(person.updatedAt.getTime()).toBeGreaterThan(before)
	})

	test("throws when the person does not exist", async () => {
		await expect(
			createNote(owner, {
				personId: "co_zNonExistent",
				content: "x",
			}),
		).rejects.toBeDefined()
	})

	describe("multi-user", () => {
		let collaborator: co.loaded<typeof UserAccount>

		beforeEach(async () => {
			collaborator = await createAccount()
		})

		test("a writer collaborator can create a note on the shared person", async () => {
			let person = await seedPerson(owner, {
				name: "Shared Ada",
				sharedWith: collaborator,
			})
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)

			let result = await createNote(collaborator, {
				personId: person.$jazz.id,
				content: "from collaborator",
			})

			expect(result.current.content).toBe("from collaborator")

			await collaborator.$jazz.waitForAllCoValuesSync()
			setActiveAccount(owner)

			let loaded = await person.$jazz.ensureLoaded({
				resolve: { notes: { $each: true } },
			})
			expect(loaded.notes.some(n => n?.content === "from collaborator")).toBe(
				true,
			)
		})

		test("a non-member cannot load the person, createNote rejects", async () => {
			let person = await seedPerson(owner, { name: "Private Ada" })
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)

			await expect(
				createNote(collaborator, {
					personId: person.$jazz.id,
					content: "should fail",
				}),
			).rejects.toBeDefined()
		})
	})
})
