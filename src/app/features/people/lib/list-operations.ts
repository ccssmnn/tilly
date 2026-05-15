export {
	removeTagFromDeselectedPeople,
	addTagToNewlySelectedPeople,
	renameTagForRemainingPeople,
	normalizeHashtag,
	removeHashtagFromSummary,
	addHashtagToSummary,
	replaceHashtagInSummary,
}

import type { Loaded } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { updatePerson } from "#shared/tools/person-update"

type PersonEntry = {
	$jazz: { id: string }
	name: string
	summary?: string
}

async function removeTagFromDeselectedPeople({
	oldTag,
	selectedPeople,
	peopleInList,
	me,
}: {
	oldTag: string
	selectedPeople: Set<string>
	peopleInList: PersonEntry[]
	me: Loaded<typeof UserAccount>
}) {
	let deselected = peopleInList.filter(p => !selectedPeople.has(p.$jazz.id))

	for (let person of deselected) {
		let newSummary = removeHashtagFromSummary(person.summary, oldTag)
		await updatePerson(me, { personId: person.$jazz.id, summary: newSummary })
	}
}

async function addTagToNewlySelectedPeople({
	oldTag,
	newTag,
	selectedPeople,
	initialSelectedPeople,
	allPeople,
	me,
}: {
	oldTag: string
	newTag: string
	selectedPeople: Set<string>
	initialSelectedPeople: Set<string>
	allPeople: PersonEntry[]
	me: Loaded<typeof UserAccount>
}) {
	let newlySelected = [...selectedPeople].filter(
		id => !initialSelectedPeople.has(id),
	)

	for (let personId of newlySelected) {
		let person = allPeople.find(p => p.$jazz.id === personId)
		if (!person) continue

		let withoutOldTag = removeHashtagFromSummary(person.summary, oldTag)
		let newSummary = addHashtagToSummary(withoutOldTag, newTag)

		await updatePerson(me, { personId, summary: newSummary })
	}
}

async function renameTagForRemainingPeople({
	oldTag,
	newTag,
	selectedPeople,
	peopleInList,
	me,
}: {
	oldTag: string
	newTag: string
	selectedPeople: Set<string>
	peopleInList: PersonEntry[]
	me: Loaded<typeof UserAccount>
}) {
	let remaining = peopleInList.filter(p => selectedPeople.has(p.$jazz.id))

	for (let person of remaining) {
		let newSummary = replaceHashtagInSummary(person.summary, oldTag, newTag)
		await updatePerson(me, { personId: person.$jazz.id, summary: newSummary })
	}
}

function normalizeHashtag(name: string) {
	return `#${name.toLowerCase().replace(/[^a-z0-9_]/g, "")}`
}

function removeHashtagFromSummary(
	summary: string | undefined,
	hashtag: string,
): string {
	if (!summary) return ""
	let escaped = hashtag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return summary
		.replace(new RegExp(`${escaped}(?=\\s|$)`, "gi"), "")
		.replace(/\s+/g, " ")
		.trim()
}

function addHashtagToSummary(
	summary: string | undefined,
	hashtag: string,
): string {
	let current = summary?.trim() || ""
	return current ? `${current} ${hashtag}` : hashtag
}

function replaceHashtagInSummary(
	summary: string | undefined,
	oldTag: string,
	newTag: string,
): string {
	if (!summary) return ""
	let escaped = oldTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return summary.replace(new RegExp(`${escaped}(?=\\s|$)`, "gi"), newTag).trim()
}
