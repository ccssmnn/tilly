export {
	removeTagFromDeselectedPeople,
	addTagToNewlySelectedPeople,
	renameTagForRemainingPeople,
	normalizeHashtag,
}

import type { Loaded } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { updatePerson } from "#shared/tools/person-update"
import {
	removeHashtagFromSummary,
	addHashtagToSummary,
	replaceHashtagInSummary,
} from "./list-utilities"

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
		await updatePerson(person.$jazz.id, { summary: newSummary }, me)
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

		await updatePerson(personId, { summary: newSummary }, me)
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
		await updatePerson(person.$jazz.id, { summary: newSummary }, me)
	}
}

function normalizeHashtag(name: string) {
	return `#${name.toLowerCase().replace(/[^a-z0-9_]/g, "")}`
}
