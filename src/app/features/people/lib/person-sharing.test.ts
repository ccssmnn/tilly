import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import { co } from "jazz-tools"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"
import {
	acceptPersonInvite,
	createPersonInviteLink,
	getInviteGroupsWithMembers,
	getPendingInviteGroups,
	isGroupOwned,
	removeInviteGroup,
} from "./person-sharing"
import { parseInviteHash } from "./invite"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"
import { updatePerson } from "#shared/tools/person-update"

let BASE_URL = "http://test.invalid/app/invite"

async function loadFullPerson(person: co.loaded<typeof Person>) {
	let loaded = await Person.load(person.$jazz.id, {
		resolve: {
			notes: { $each: { $onError: "catch" } },
			reminders: { $each: { $onError: "catch" } },
			inactiveNotes: { $each: { $onError: "catch" } },
			inactiveReminders: { $each: { $onError: "catch" } },
		},
	})
	if (!loaded?.$isLoaded) throw new Error("Failed to load full person")
	return loaded
}

function parseInviteLink(link: string) {
	let hashIdx = link.indexOf("#")
	if (hashIdx === -1) throw new Error("No hash in invite link")
	let data = parseInviteHash(link.slice(hashIdx))
	if (!data) throw new Error("Invalid invite link")
	return data
}

describe("Person sharing", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	describe("createPersonInviteLink", () => {
		test("emits the canonical invite URL format", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)

			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			expect(link).toMatch(
				new RegExp(
					`^${BASE_URL.replace(/\./g, "\\.")}#/person/co_[^/]+/invite/co_[^/]+/inviteSecret_`,
				),
			)
		})

		test("parsed invite resolves to the original personId", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)

			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)
			expect(parsed.personId).toBe(person.$jazz.id)
		})
	})

	describe("acceptPersonInvite", () => {
		test("invitee gains access and the person is pushed to their root.people", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)
			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)
			await owner.$jazz.waitForAllCoValuesSync()

			let invitee = await createAccount()
			setActiveAccount(invitee)
			let loadedInvitee = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})

			let result = await acceptPersonInvite(loadedInvitee, parsed)
			expect(result.status).toBe("accepted")

			let after = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: { $each: true } } },
			})
			expect(after.root.people.some(p => p?.$jazz.id === person.$jazz.id)).toBe(
				true,
			)
		})

		test("invitee can edit the shared person (writer role grants write access)", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)
			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)
			await owner.$jazz.waitForAllCoValuesSync()

			let invitee = await createAccount()
			setActiveAccount(invitee)
			let loadedInvitee = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})
			await acceptPersonInvite(loadedInvitee, parsed)

			await updatePerson(invitee, {
				personId: person.$jazz.id,
				name: "Ada by invitee",
			})
			await invitee.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloaded = await Person.load(person.$jazz.id)
			expect(reloaded?.$isLoaded ? reloaded.name : null).toBe("Ada by invitee")
		})

		test("accepting twice is idempotent (already-member, no duplicate in list)", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)
			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)
			await owner.$jazz.waitForAllCoValuesSync()

			let invitee = await createAccount()
			setActiveAccount(invitee)
			let loadedInvitee = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})

			let first = await acceptPersonInvite(loadedInvitee, parsed)
			let second = await acceptPersonInvite(loadedInvitee, parsed)

			expect(first.status).toBe("accepted")
			expect(second.status).toBe("already-member")

			let after = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: { $each: true } } },
			})
			let matches = after.root.people.filter(
				p => p?.$jazz.id === person.$jazz.id,
			)
			expect(matches.length).toBe(1)
		})
	})

	describe("revocation", () => {
		test("revoked invitee loses read access to the person", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)
			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)
			await owner.$jazz.waitForAllCoValuesSync()

			let invitee = await createAccount()
			setActiveAccount(invitee)
			let loadedInvitee = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})
			await acceptPersonInvite(loadedInvitee, parsed)

			let visibleBefore = await Person.load(person.$jazz.id)
			expect(visibleBefore?.$isLoaded).toBe(true)

			setActiveAccount(owner)
			removeInviteGroup(
				person,
				parsed.inviteGroupId as Parameters<typeof removeInviteGroup>[1],
			)
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(invitee)
			let visibleAfter = await Person.load(person.$jazz.id)
			expect(visibleAfter?.$jazz.loadingState).toBe("unauthorized")
		})
	})

	describe("getInviteGroupsWithMembers / getPendingInviteGroups", () => {
		test("pending groups show accepted-but-empty invites; members appear after acceptance", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)
			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)

			let pendingBefore = getPendingInviteGroups(person)
			expect(pendingBefore.some(p => p.groupId === parsed.inviteGroupId)).toBe(
				true,
			)

			let withMembersBefore = await getInviteGroupsWithMembers(person)
			expect(withMembersBefore.length).toBe(0)

			await owner.$jazz.waitForAllCoValuesSync()
			let invitee = await createAccount()
			setActiveAccount(invitee)
			let loadedInvitee = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})
			await acceptPersonInvite(loadedInvitee, parsed)
			await invitee.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloadedPerson = await Person.load(person.$jazz.id)
			if (!reloadedPerson?.$isLoaded) throw new Error("person gone")
			let withMembersAfter = await getInviteGroupsWithMembers(reloadedPerson)
			expect(
				withMembersAfter.some(g => g.groupId === parsed.inviteGroupId),
			).toBe(true)
			expect(
				withMembersAfter
					.find(g => g.groupId === parsed.inviteGroupId)
					?.members.some(m => m.id === invitee.$jazz.id),
			).toBe(true)
		})
	})

	describe("legacy account-owned migration", () => {
		async function seedAccountOwnedPerson(
			account: co.loaded<typeof UserAccount>,
			name: string,
		) {
			let { root } = await account.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})
			let now = new Date()
			let person = Person.create(
				{
					version: 1,
					name,
					notes: co.list(Note).create([], account),
					reminders: co.list(Reminder).create([], account),
					createdAt: now,
					updatedAt: now,
				},
				account,
			)
			root.people.$jazz.push(person)
			return person
		}

		test("isGroupOwned reports false for account-owned persons", async () => {
			let person = await seedAccountOwnedPerson(owner, "Legacy")
			let full = await loadFullPerson(person)
			expect(isGroupOwned(full)).toBe(false)
		})

		test("isGroupOwned reports true for group-owned persons", async () => {
			let person = await seedPerson(owner, { name: "Modern" })
			let full = await loadFullPerson(person)
			expect(isGroupOwned(full)).toBe(true)
		})

		test("inviting an account-owned person migrates it and yields a working link", async () => {
			let original = await seedAccountOwnedPerson(owner, "Legacy")
			let full = await loadFullPerson(original)

			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let parsed = parseInviteLink(link)

			expect(parsed.personId).not.toBe(original.$jazz.id)

			let migrated = await Person.load(parsed.personId)
			expect(migrated?.$isLoaded).toBe(true)
			if (!migrated?.$isLoaded) return
			expect(migrated.name).toBe("Legacy")
			expect(isGroupOwned(migrated)).toBe(true)

			await owner.$jazz.waitForAllCoValuesSync()

			let invitee = await createAccount()
			setActiveAccount(invitee)
			let loadedInvitee = await invitee.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})

			let result = await acceptPersonInvite(loadedInvitee, parsed)
			expect(result.status).toBe("accepted")
		})
	})
})
