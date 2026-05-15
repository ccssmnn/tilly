import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"
import {
	normalizeHashtag,
	removeHashtagFromSummary,
	addHashtagToSummary,
	replaceHashtagInSummary,
	removeTagFromDeselectedPeople,
	addTagToNewlySelectedPeople,
	renameTagForRemainingPeople,
} from "./list-operations"

describe("normalizeHashtag", () => {
	test("lowercases and strips non-alphanumeric characters", () => {
		expect(normalizeHashtag("Hello World!")).toBe("#helloworld")
	})

	test("preserves underscores", () => {
		expect(normalizeHashtag("my_tag")).toBe("#my_tag")
	})

	test("handles empty string", () => {
		expect(normalizeHashtag("")).toBe("#")
	})

	test("strips special chars", () => {
		expect(normalizeHashtag("café-résumé")).toBe("#cafrsum")
	})
})

describe("removeHashtagFromSummary", () => {
	test("removes tag from end of summary", () => {
		expect(
			removeHashtagFromSummary("friend from work #colleague", "#colleague"),
		).toBe("friend from work")
	})

	test("removes tag from middle of summary", () => {
		expect(removeHashtagFromSummary("a #foo b", "#foo")).toBe("a b")
	})

	test("removes tag when it is the only content", () => {
		expect(removeHashtagFromSummary("#only", "#only")).toBe("")
	})

	test("returns empty string for undefined summary", () => {
		expect(removeHashtagFromSummary(undefined, "#tag")).toBe("")
	})

	test("is case-insensitive", () => {
		expect(removeHashtagFromSummary("hi #Friend", "#friend")).toBe("hi")
	})

	test("does not remove partial matches", () => {
		expect(removeHashtagFromSummary("#friends forever", "#friend")).toBe(
			"#friends forever",
		)
	})

	test("collapses multiple spaces after removal", () => {
		expect(removeHashtagFromSummary("a  #tag  b", "#tag")).toBe("a b")
	})
})

describe("addHashtagToSummary", () => {
	test("appends tag to existing summary", () => {
		expect(addHashtagToSummary("old friend", "#colleague")).toBe(
			"old friend #colleague",
		)
	})

	test("returns just the tag for empty summary", () => {
		expect(addHashtagToSummary("", "#new")).toBe("#new")
	})

	test("returns just the tag for undefined summary", () => {
		expect(addHashtagToSummary(undefined, "#new")).toBe("#new")
	})

	test("trims whitespace before appending", () => {
		expect(addHashtagToSummary("  padded  ", "#tag")).toBe("padded #tag")
	})
})

describe("replaceHashtagInSummary", () => {
	test("replaces old tag with new tag", () => {
		expect(replaceHashtagInSummary("my #old friend", "#old", "#new")).toBe(
			"my #new friend",
		)
	})

	test("returns empty string for undefined summary", () => {
		expect(replaceHashtagInSummary(undefined, "#old", "#new")).toBe("")
	})

	test("is case-insensitive", () => {
		expect(replaceHashtagInSummary("hi #OLD pal", "#old", "#new")).toBe(
			"hi #new pal",
		)
	})

	test("only replaces whole-word matches", () => {
		expect(replaceHashtagInSummary("#oldfriend #old", "#old", "#new")).toBe(
			"#oldfriend #new",
		)
	})

	test("replaces tag at end of string", () => {
		expect(replaceHashtagInSummary("notes #old", "#old", "#new")).toBe(
			"notes #new",
		)
	})
})

describe("bulk tag operations", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("removeTagFromDeselectedPeople strips tag from unselected people", async () => {
		let alice = await seedPerson(owner, {
			name: "Alice",
			summary: "friend #team",
		})
		let bob = await seedPerson(owner, {
			name: "Bob",
			summary: "colleague #team",
		})

		let selectedPeople = new Set([alice.$jazz.id])

		await removeTagFromDeselectedPeople({
			oldTag: "#team",
			selectedPeople,
			peopleInList: [
				{
					$jazz: { id: alice.$jazz.id },
					name: "Alice",
					summary: "friend #team",
				},
				{
					$jazz: { id: bob.$jazz.id },
					name: "Bob",
					summary: "colleague #team",
				},
			],
			me: owner,
		})

		let reloaded = await bob.$jazz.ensureLoaded({ resolve: {} })
		expect(reloaded.summary).toBe("colleague")
	})

	test("addTagToNewlySelectedPeople adds tag only to newly selected", async () => {
		let alice = await seedPerson(owner, { name: "Alice", summary: "friend" })
		let bob = await seedPerson(owner, {
			name: "Bob",
			summary: "colleague #old",
		})

		let initialSelected = new Set([bob.$jazz.id])
		let selectedPeople = new Set([alice.$jazz.id, bob.$jazz.id])

		await addTagToNewlySelectedPeople({
			oldTag: "#old",
			newTag: "#new",
			selectedPeople,
			initialSelectedPeople: initialSelected,
			allPeople: [
				{ $jazz: { id: alice.$jazz.id }, name: "Alice", summary: "friend" },
				{ $jazz: { id: bob.$jazz.id }, name: "Bob", summary: "colleague #old" },
			],
			me: owner,
		})

		let reloadedAlice = await alice.$jazz.ensureLoaded({ resolve: {} })
		expect(reloadedAlice.summary).toBe("friend #new")

		let reloadedBob = await bob.$jazz.ensureLoaded({ resolve: {} })
		expect(reloadedBob.summary).toBe("colleague #old")
	})

	test("renameTagForRemainingPeople renames tag for selected people", async () => {
		let alice = await seedPerson(owner, {
			name: "Alice",
			summary: "friend #old",
		})

		await renameTagForRemainingPeople({
			oldTag: "#old",
			newTag: "#new",
			selectedPeople: new Set([alice.$jazz.id]),
			peopleInList: [
				{
					$jazz: { id: alice.$jazz.id },
					name: "Alice",
					summary: "friend #old",
				},
			],
			me: owner,
		})

		let reloaded = await alice.$jazz.ensureLoaded({ resolve: {} })
		expect(reloaded.summary).toBe("friend #new")
	})
})
