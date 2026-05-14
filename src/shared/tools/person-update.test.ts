import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Person, UserAccount } from "#shared/schema/user"
import { updatePerson } from "#shared/tools/person-update"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"

describe("updatePerson", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("updates name and summary, returns previous + current", async () => {
		let person = await seedPerson(owner, {
			name: "Ada",
			summary: "old summary",
		})

		let result = await updatePerson(owner, {
			personId: person.$jazz.id,
			name: "Ada L.",
			summary: "new summary",
		})

		expect(result.operation).toBe("update")
		expect(result.previous.name).toBe("Ada")
		expect(result.previous.summary).toBe("old summary")
		expect(result.current.name).toBe("Ada L.")
		expect(result.current.summary).toBe("new summary")
	})

	test("partial update leaves untouched fields", async () => {
		let person = await seedPerson(owner, {
			name: "Ada",
			summary: "keep this",
		})

		let result = await updatePerson(owner, {
			personId: person.$jazz.id,
			name: "Ada L.",
		})

		expect(result.current.summary).toBe("keep this")
	})

	test("soft delete moves person from active to inactivePeople", async () => {
		let person = await seedPerson(owner, { name: "Bye" })

		await updatePerson(owner, {
			personId: person.$jazz.id,
			deletedAt: new Date(),
		})

		let { root } = await owner.$jazz.ensureLoaded({
			resolve: {
				root: { people: { $each: true }, inactivePeople: { $each: true } },
			},
		})
		expect(root.people.some(p => p?.$jazz.id === person.$jazz.id)).toBe(false)
		expect(
			root.inactivePeople?.some(p => p?.$jazz.id === person.$jazz.id),
		).toBe(true)
	})

	test("restore moves back from inactivePeople to active", async () => {
		let person = await seedPerson(owner, { name: "Back" })
		await updatePerson(owner, {
			personId: person.$jazz.id,
			deletedAt: new Date(),
		})

		await updatePerson(owner, {
			personId: person.$jazz.id,
			deletedAt: undefined,
		})

		let { root } = await owner.$jazz.ensureLoaded({
			resolve: {
				root: { people: { $each: true }, inactivePeople: { $each: true } },
			},
		})
		expect(root.people.some(p => p?.$jazz.id === person.$jazz.id)).toBe(true)
		expect(
			root.inactivePeople?.some(p => p?.$jazz.id === person.$jazz.id),
		).toBe(false)
	})

	test("throws when person not found", async () => {
		await expect(
			updatePerson(owner, { personId: "co_zNope", name: "x" }),
		).rejects.toBeDefined()
	})

	describe("multi-user", () => {
		test("collaborator edit is visible to owner after sync", async () => {
			let collaborator = await createAccount()
			let person = await seedPerson(owner, {
				name: "Shared",
				sharedWith: collaborator,
			})
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			await updatePerson(collaborator, {
				personId: person.$jazz.id,
				name: "Edited by other",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloaded = await Person.load(person.$jazz.id)
			expect(reloaded?.$isLoaded ? reloaded.name : null).toBe("Edited by other")
		})
	})
})
