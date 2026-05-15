import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Note, UserAccount } from "#shared/schema/user"
import { updateNote } from "#shared/tools/note-update"
import { createAccount, seedNote, seedPerson } from "#shared/tools/test-helpers"

describe("updateNote", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("edits content and returns previous + current", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "before" })

		let result = await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			content: "after",
		})

		expect(result.previous.content).toBe("before")
		expect(result.current.content).toBe("after")

		let reloaded = await Note.load(note.$jazz.id)
		expect(reloaded?.$isLoaded ? reloaded.content : null).toBe("after")
	})

	test("toggle pin", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "x", pinned: false })

		let result = await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			pinned: true,
		})
		expect(result.previous.pinned).toBe(false)
		expect(result.current.pinned).toBe(true)
	})

	test("soft delete moves note from notes to inactiveNotes", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "delete me" })

		await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			deletedAt: new Date(),
		})

		let loaded = await person.$jazz.ensureLoaded({
			resolve: { notes: { $each: true }, inactiveNotes: { $each: true } },
		})
		expect(loaded.notes.some(n => n?.$jazz.id === note.$jazz.id)).toBe(false)
		expect(loaded.inactiveNotes?.some(n => n?.$jazz.id === note.$jazz.id)).toBe(
			true,
		)
	})

	test("restore moves note back from inactiveNotes", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "restore me" })
		await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			deletedAt: new Date(),
		})

		await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			deletedAt: undefined,
		})

		let loaded = await person.$jazz.ensureLoaded({
			resolve: { notes: { $each: true }, inactiveNotes: { $each: true } },
		})
		expect(loaded.notes.some(n => n?.$jazz.id === note.$jazz.id)).toBe(true)
		expect(loaded.inactiveNotes?.some(n => n?.$jazz.id === note.$jazz.id)).toBe(
			false,
		)
	})

	test("throws when note not found", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await expect(
			updateNote(owner, {
				personId: person.$jazz.id,
				noteId: "co_zNope",
				content: "x",
			}),
		).rejects.toBeDefined()
	})

	describe("multi-user", () => {
		test("collaborator edit visible to owner", async () => {
			let collaborator = await createAccount()
			let person = await seedPerson(owner, {
				name: "Shared",
				sharedWith: collaborator,
			})
			let note = await seedNote(person, { content: "original" })
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			await updateNote(collaborator, {
				personId: person.$jazz.id,
				noteId: note.$jazz.id,
				content: "edited remotely",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloaded = await Note.load(note.$jazz.id)
			expect(reloaded?.$isLoaded ? reloaded.content : null).toBe(
				"edited remotely",
			)
		})
	})
})
