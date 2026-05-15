import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { Person, UserAccount } from "#shared/schema/user"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"
import { isPersonAdmin, getPersonOwnerName } from "./person-utils"

describe("isPersonAdmin", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns true for person owned by admin (creator)", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		expect(isPersonAdmin(person)).toBe(true)
	})

	test("returns false for writer collaborator", async () => {
		let collaborator = await createAccount()
		let person = await seedPerson(owner, {
			name: "Shared",
			sharedWith: collaborator,
		})

		await owner.$jazz.waitForAllCoValuesSync()

		let { setActiveAccount } = await import("jazz-tools/testing")
		setActiveAccount(collaborator)

		let loaded = await Person.load(person.$jazz.id)
		expect(loaded?.$isLoaded).toBe(true)
		if (!loaded?.$isLoaded) return
		expect(isPersonAdmin(loaded)).toBe(false)
	})
})

describe("getPersonOwnerName", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns the admin's profile name for a group-owned person", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let name = await getPersonOwnerName(person)
		expect(typeof name).toBe("string")
	})
})
