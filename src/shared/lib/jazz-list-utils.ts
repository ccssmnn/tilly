export {
	isLoadedList,
	findIndex,
	moveToInactive,
	moveToActive,
	removeFromInactive,
	removeAtIndices,
	useInactiveCleanup,
	isStale,
	markStaleAsPermanentlyDeleted,
	cleanupInactiveLists,
}

import { useEffect, useRef } from "react"

type JazzList = {
	$isLoaded: boolean
	$jazz: {
		push(item: unknown): void
		splice(index: number, count: number): void
	}
	values(): IterableIterator<({ $jazz: { id: string } } & unknown) | null>
}

function isLoadedList(list: unknown): list is JazzList {
	return (
		list != null &&
		typeof list === "object" &&
		"$isLoaded" in list &&
		list.$isLoaded === true
	)
}

function findIndex(list: JazzList, id: string): number {
	return Array.from(list.values()).findIndex(item => item?.$jazz.id === id)
}

function moveToInactive(active: unknown, inactive: unknown, id: string): void {
	if (!isLoadedList(active) || !isLoadedList(inactive)) return
	let index = findIndex(active, id)
	if (index === -1) return
	let item = Array.from(active.values())[index]
	if (!item) return
	inactive.$jazz.push(item)
	active.$jazz.splice(index, 1)
}

function moveToActive(active: unknown, inactive: unknown, id: string): void {
	if (!isLoadedList(active) || !isLoadedList(inactive)) return
	let index = findIndex(inactive, id)
	if (index === -1) return
	let item = Array.from(inactive.values())[index]
	if (!item) return
	active.$jazz.push(item)
	inactive.$jazz.splice(index, 1)
}

function removeFromInactive(inactive: unknown, id: string): void {
	if (!isLoadedList(inactive)) return
	let index = findIndex(inactive, id)
	if (index === -1) return
	inactive.$jazz.splice(index, 1)
}

function isStale(deletedAt: Date | undefined): boolean {
	if (!deletedAt) return false
	let thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
	return deletedAt < thirtyDaysAgo
}

type DeletableItem = {
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	$jazz: { set(key: string, value: unknown): void }
}

function markStaleAsPermanentlyDeleted(
	item: DeletableItem,
	beforePermanentDelete?: (item: DeletableItem) => void,
): void {
	if (item.deletedAt && !item.permanentlyDeletedAt && isStale(item.deletedAt)) {
		beforePermanentDelete?.(item)
		item.$jazz.set("permanentlyDeletedAt", item.deletedAt)
	}
}

function removeAtIndices(
	list: { $jazz: { splice(index: number, count: number): void } },
	indices: number[],
): void {
	for (let i = indices.length - 1; i >= 0; i--) {
		list.$jazz.splice(indices[i], 1)
	}
}

type PersonWithLists = {
	notes?: unknown
	inactiveNotes?: unknown
	reminders?: unknown
	inactiveReminders?: unknown
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	$jazz: { id: string; set(key: string, value: unknown): void; owner: unknown }
}

type NoteItem = DeletableItem & {
	$jazz: { id: string; set(key: string, value: unknown): void }
}
type ReminderItem = DeletableItem & {
	done?: boolean
	$jazz: { id: string; set(key: string, value: unknown): void }
}

function cleanupInactiveLists(
	people: unknown,
	inactivePeople: unknown,
	beforePersonPermanentDelete?: (person: PersonWithLists) => void,
): boolean {
	if (!isLoadedList(people)) return false

	let didCleanup = false

	// Process people: mark stale, remove permanently deleted, move deleted to inactive
	didCleanup = processActiveList<PersonWithLists>(
		people,
		inactivePeople,
		item => !!item.deletedAt,
		beforePersonPermanentDelete,
	)

	// Clean stale from inactive people
	didCleanup =
		cleanupStaleFromList(inactivePeople, beforePersonPermanentDelete) ||
		didCleanup

	// Process each person's notes and reminders
	for (let person of Array.from(
		people.values(),
	) as (PersonWithLists | null)[]) {
		if (!person) continue

		// Process notes
		if (person.notes && person.inactiveNotes) {
			didCleanup =
				processActiveList<NoteItem>(
					person.notes,
					person.inactiveNotes,
					item => !!item.deletedAt,
				) || didCleanup
		}
		if (person.inactiveNotes) {
			didCleanup = cleanupStaleFromList(person.inactiveNotes) || didCleanup
		}

		// Process reminders
		if (person.reminders && person.inactiveReminders) {
			didCleanup =
				processActiveList<ReminderItem>(
					person.reminders,
					person.inactiveReminders,
					item => !!item.deletedAt || !!item.done,
				) || didCleanup
		}
		if (person.inactiveReminders) {
			didCleanup = cleanupStaleFromList(person.inactiveReminders) || didCleanup
		}
	}

	return didCleanup
}

function processActiveList<T extends DeletableItem & { $jazz: { id: string } }>(
	active: unknown,
	inactive: unknown,
	shouldBeInactive: (item: T) => boolean,
	beforePermanentDelete?: (item: T) => void,
): boolean {
	if (!isLoadedList(active) || !isLoadedList(inactive)) return false

	let toRemove: number[] = []
	let toMove: number[] = []
	let activeArray = Array.from(active.values()) as (T | null)[]

	for (let i = 0; i < activeArray.length; i++) {
		let item = activeArray[i]
		if (!item) continue

		markStaleAsPermanentlyDeleted(
			item,
			beforePermanentDelete as (item: DeletableItem) => void,
		)

		if (item.permanentlyDeletedAt) {
			toRemove.push(i)
			continue
		}

		if (shouldBeInactive(item)) {
			toMove.push(i)
		}
	}

	// Move items to inactive (in reverse to preserve indices)
	for (let i = toMove.length - 1; i >= 0; i--) {
		let item = activeArray[toMove[i]]
		if (item) {
			inactive.$jazz.push(item)
		}
	}

	// Remove all items that should be removed or moved
	let allToRemove = [...new Set([...toRemove, ...toMove])].sort((a, b) => a - b)
	removeAtIndices(active, allToRemove)

	return toRemove.length > 0 || toMove.length > 0
}

function cleanupStaleFromList<T extends DeletableItem>(
	items: unknown,
	beforePermanentDelete?: (item: T) => void,
): boolean {
	if (!isLoadedList(items)) return false

	let toRemove: number[] = []
	let itemArray = Array.from(items.values()) as (T | null)[]

	for (let i = 0; i < itemArray.length; i++) {
		let item = itemArray[i]
		if (!item) continue

		markStaleAsPermanentlyDeleted(
			item,
			beforePermanentDelete as (item: DeletableItem) => void,
		)

		if (item.permanentlyDeletedAt) {
			toRemove.push(i)
		}
	}

	if (toRemove.length > 0) {
		removeAtIndices(items, toRemove)
		return true
	}
	return false
}

function useInactiveCleanup(
	people: unknown,
	inactivePeople: unknown,
	beforePersonPermanentDelete?: (person: PersonWithLists) => void,
): void {
	let cleanupRan = useRef(false)

	useEffect(() => {
		if (cleanupRan.current) return
		cleanupRan.current = cleanupInactiveLists(
			people,
			inactivePeople,
			beforePersonPermanentDelete,
		)
	}, [people, inactivePeople, beforePersonPermanentDelete])
}
