import { describe, expect, test } from "vitest"
import {
	getLoadedCoListValues,
	removeCoListRefsById,
	removeCoValueRefsByLoadingStates,
	removeDeletedCoValueRefs,
} from "./co-list-utils"

function createMockCoList<T>(items: T[]) {
	let list = Object.assign([...items], {
		$jazz: {
			splice(start: number, deleteCount: number) {
				list.splice(start, deleteCount)
			},
		},
		values() {
			return list[Symbol.iterator]()
		},
	})
	return list
}

describe("getLoadedCoListValues", () => {
	test("returns only loaded values", () => {
		let list = createMockCoList([
			{ $isLoaded: true, name: "a" },
			{ $isLoaded: false, name: "b" },
			null,
			{ $isLoaded: true, name: "c" },
		])
		let result = getLoadedCoListValues<{ $isLoaded: boolean; name: string }>(
			list,
		)
		expect(result.map(r => r.name)).toEqual(["a", "c"])
	})

	test("returns empty array for non-list input", () => {
		expect(getLoadedCoListValues(null)).toEqual([])
		expect(getLoadedCoListValues("string")).toEqual([])
		expect(getLoadedCoListValues(42)).toEqual([])
	})

	test("returns empty array for list with all null values", () => {
		let list = createMockCoList([null, null, undefined])
		expect(getLoadedCoListValues(list)).toEqual([])
	})
})

describe("removeDeletedCoValueRefs", () => {
	test("removes refs with 'deleted' loading state", () => {
		let list = createMockCoList([
			{ $isLoaded: true, name: "keep" },
			{ $isLoaded: false, $jazz: { loadingState: "deleted" } },
			{ $isLoaded: true, name: "also keep" },
		])

		removeDeletedCoValueRefs(list)
		expect(list.length).toBe(2)
	})

	test("does not remove refs with other loading states", () => {
		let list = createMockCoList([
			{ $isLoaded: false, $jazz: { loadingState: "loading" } },
			{ $isLoaded: false, $jazz: { loadingState: "unavailable" } },
		])

		removeDeletedCoValueRefs(list)
		expect(list.length).toBe(2)
	})

	test("handles empty list", () => {
		let list = createMockCoList([])
		removeDeletedCoValueRefs(list)
		expect(list.length).toBe(0)
	})
})

describe("removeCoValueRefsByLoadingStates", () => {
	test("removes refs matching any of the given states", () => {
		let list = createMockCoList([
			{ $isLoaded: false, $jazz: { loadingState: "deleted" } },
			{ $isLoaded: true, name: "loaded" },
			{ $isLoaded: false, $jazz: { loadingState: "unavailable" } },
			{ $isLoaded: false, $jazz: { loadingState: "loading" } },
		])

		removeCoValueRefsByLoadingStates(list, ["deleted", "unavailable"])
		expect(list.length).toBe(2)
	})

	test("skips loaded items even if they have jazz metadata", () => {
		let list = createMockCoList([
			{ $isLoaded: true, $jazz: { loadingState: "deleted" } },
		])

		removeCoValueRefsByLoadingStates(list, ["deleted"])
		expect(list.length).toBe(1)
	})

	test("skips null entries", () => {
		let list = createMockCoList([
			null,
			{ $isLoaded: false, $jazz: { loadingState: "deleted" } },
		])

		removeCoValueRefsByLoadingStates(list, ["deleted"])
		expect(list.length).toBe(1)
	})

	test("is a no-op on non-list input", () => {
		removeCoValueRefsByLoadingStates(null, ["deleted"])
		removeCoValueRefsByLoadingStates({}, ["deleted"])
	})
})

describe("removeCoListRefsById", () => {
	test("removes all refs matching the given id", () => {
		let list = createMockCoList([
			{ $jazz: { id: "co_a" } },
			{ $jazz: { id: "co_b" } },
			{ $jazz: { id: "co_a" } },
		])

		removeCoListRefsById(list, "co_a")
		expect(list.length).toBe(1)
		expect(list[0].$jazz.id).toBe("co_b")
	})

	test("handles null entries in the list", () => {
		let list = createMockCoList([null, { $jazz: { id: "co_a" } }, null])

		removeCoListRefsById(list, "co_a")
		expect(list.length).toBe(2)
	})

	test("is a no-op when id not found", () => {
		let list = createMockCoList([{ $jazz: { id: "co_b" } }])

		removeCoListRefsById(list, "co_a")
		expect(list.length).toBe(1)
	})
})
