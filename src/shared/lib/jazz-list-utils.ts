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
	cleanupStaleItems,
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

type CleanupItem = {
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	$isLoaded?: boolean
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

function markStaleAsPermanentlyDeleted(item: DeletableItem): void {
	if (item.deletedAt && !item.permanentlyDeletedAt && isStale(item.deletedAt)) {
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

function cleanupStaleItems(items: unknown): boolean {
	if (!isLoadedList(items)) return false

	let toRemove: number[] = []
	let itemArray = Array.from(items.values()) as (CleanupItem | null)[]

	for (let i = 0; i < itemArray.length; i++) {
		let item = itemArray[i]
		if (!item) continue
		if (item.$isLoaded === false) continue
		if (item.permanentlyDeletedAt || isStale(item.deletedAt)) {
			toRemove.push(i)
		}
	}

	if (toRemove.length > 0) {
		for (let i = toRemove.length - 1; i >= 0; i--) {
			items.$jazz.splice(toRemove[i], 1)
		}
		return true
	}
	return false
}

type PersonWithInactive = {
	inactiveNotes?: unknown
	inactiveReminders?: unknown
}

function useInactiveCleanup(
	inactivePeople: unknown,
	people: Array<PersonWithInactive> | undefined,
): void {
	let cleanupRan = useRef(false)

	useEffect(() => {
		if (cleanupRan.current) return

		let didCleanup = false

		if (inactivePeople) {
			didCleanup = cleanupStaleItems(inactivePeople) || didCleanup
		}

		if (people) {
			for (let person of people) {
				if (person.inactiveNotes) {
					didCleanup = cleanupStaleItems(person.inactiveNotes) || didCleanup
				}
				if (person.inactiveReminders) {
					didCleanup = cleanupStaleItems(person.inactiveReminders) || didCleanup
				}
			}
		}

		if (didCleanup) {
			cleanupRan.current = true
		}
	}, [inactivePeople, people])
}
