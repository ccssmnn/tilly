import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { Person, UserAccount } from "#shared/schema/user"
import { createPerson } from "#shared/tools/person-create"
import { createAccount } from "#shared/tools/test-helpers"

describe("createPerson", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("creates a person and appends to root.people", async () => {
		let result = await createPerson(owner, {
			name: "Ada Lovelace",
			summary: "mathematician",
		})

		expect(result.operation).toBe("create")
		expect(result.current.name).toBe("Ada Lovelace")
		expect(result.current.summary).toBe("mathematician")

		let { root } = await owner.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: true } } },
		})
		expect(root.people.length).toBe(1)
		expect(root.people[0]?.$jazz.id).toBe(result.current.personId)
		expect(root.people[0]?.name).toBe("Ada Lovelace")
	})

	test("created person reloads from its ID with content intact", async () => {
		let result = await createPerson(owner, { name: "Grace" })

		let reloaded = await Person.load(result.current.personId)
		expect(reloaded?.$isLoaded).toBe(true)
		if (!reloaded?.$isLoaded) return
		expect(reloaded.name).toBe("Grace")
	})

	test("summary is optional", async () => {
		let result = await createPerson(owner, { name: "Anon" })
		expect(result.current.summary).toBeUndefined()
	})
})
