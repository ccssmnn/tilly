import { describe, test, expect } from "vitest"
import { filterPeople } from "#app/features/person-filters"

type MockPerson = {
	name: string
	summary?: string
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	updatedAt?: Date
	createdAt?: Date
	$jazz: { lastUpdatedAt: number; createdAt: number }
}

function createPerson(
	name: string,
	overrides?: Partial<MockPerson>,
): MockPerson {
	let now = Date.now()
	return {
		name,
		$jazz: { lastUpdatedAt: now, createdAt: now },
		...overrides,
	}
}

describe("filterPeople", () => {
	describe("list filtering with hashtags", () => {
		test("filters by hashtag in summary", () => {
			let people = [
				createPerson("Alice", { summary: "Friend #family" }),
				createPerson("Bob", { summary: "Colleague #work" }),
				createPerson("Charlie", { summary: "Friend #family #work" }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: "#family",
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice", "Charlie"])
		})

		test("returns all when no list filter", () => {
			let people = [
				createPerson("Alice", { summary: "Friend #family" }),
				createPerson("Bob", { summary: "Colleague #work" }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice", "Bob"])
		})

		test("matches hashtag case-insensitively", () => {
			let people = [
				createPerson("Alice", { summary: "Friend #Family" }),
				createPerson("Bob", { summary: "Friend #FAMILY" }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: "#family",
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice", "Bob"])
		})

		test("does not match partial hashtags", () => {
			let people = [
				createPerson("Alice", { summary: "Friend #familytime" }),
				createPerson("Bob", { summary: "Friend #family" }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: "#family",
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Bob"])
		})

		test("returns empty when no matches", () => {
			let people = [
				createPerson("Alice", { summary: "Friend #work" }),
				createPerson("Bob", { summary: "Colleague" }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: "#family",
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result).toEqual([])
		})
	})

	describe("search query filtering", () => {
		test("filters by name", () => {
			let people = [
				createPerson("Alice Smith"),
				createPerson("Bob Jones"),
				createPerson("Alicia Keys"),
			]

			let result = filterPeople(people, "ali", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice Smith", "Alicia Keys"])
		})

		test("filters by summary content", () => {
			let people = [
				createPerson("Alice", { summary: "Works at Google" }),
				createPerson("Bob", { summary: "Works at Apple" }),
			]

			let result = filterPeople(people, "google", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice"])
		})

		test("search is case-insensitive", () => {
			let people = [createPerson("Alice Smith")]

			let result = filterPeople(people, "ALICE", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice Smith"])
		})
	})

	describe("combined list and search filtering", () => {
		test("applies both list filter and search query", () => {
			let people = [
				createPerson("Alice Smith", { summary: "Friend #family" }),
				createPerson("Alice Jones", { summary: "Colleague #work" }),
				createPerson("Bob Smith", { summary: "Uncle #family" }),
			]

			let result = filterPeople(people, "alice", undefined, {
				listFilter: "#family",
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice Smith"])
		})
	})

	describe("status filtering", () => {
		test("filters active people by default", () => {
			let people = [
				createPerson("Alice"),
				createPerson("Bob", { deletedAt: new Date() }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice"])
		})

		test("filters deleted people when status is deleted", () => {
			let people = [
				createPerson("Alice"),
				createPerson("Bob", { deletedAt: new Date() }),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "deleted",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Bob"])
		})

		test("excludes permanently deleted from both active and deleted", () => {
			let people = [
				createPerson("Alice"),
				createPerson("Bob", { deletedAt: new Date() }),
				createPerson("Charlie", { permanentlyDeletedAt: new Date() }),
			]

			let activeResult = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			let deletedResult = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "deleted",
				sortMode: "alphabetical",
			})

			expect(activeResult.map(p => p.name)).toEqual(["Alice"])
			expect(deletedResult.map(p => p.name)).toEqual(["Bob"])
		})
	})

	describe("combining active/inactive people lists", () => {
		test("combines active and inactive people", () => {
			let active = [createPerson("Alice")]
			let inactive = [createPerson("Bob", { deletedAt: new Date() })]

			let result = filterPeople(active, "", inactive, {
				listFilter: null,
				statusFilter: "deleted",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Bob"])
		})
	})

	describe("sorting", () => {
		test("sorts alphabetically when sortMode is alphabetical", () => {
			let people = [
				createPerson("Charlie"),
				createPerson("Alice"),
				createPerson("Bob"),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "alphabetical",
			})

			expect(result.map(p => p.name)).toEqual(["Alice", "Bob", "Charlie"])
		})

		test("sorts by updatedAt when sortMode is recent", () => {
			let now = Date.now()
			let people = [
				createPerson("Alice", {
					updatedAt: new Date(now - 2000),
					$jazz: { lastUpdatedAt: now - 2000, createdAt: now - 3000 },
				}),
				createPerson("Bob", {
					updatedAt: new Date(now),
					$jazz: { lastUpdatedAt: now, createdAt: now - 1000 },
				}),
				createPerson("Charlie", {
					updatedAt: new Date(now - 1000),
					$jazz: { lastUpdatedAt: now - 1000, createdAt: now - 2000 },
				}),
			]

			let result = filterPeople(people, "", undefined, {
				listFilter: null,
				statusFilter: "active",
				sortMode: "recent",
			})

			expect(result.map(p => p.name)).toEqual(["Bob", "Charlie", "Alice"])
		})
	})

	describe("default options", () => {
		test("uses sensible defaults when no options provided", () => {
			let people = [
				createPerson("Alice"),
				createPerson("Bob", { deletedAt: new Date() }),
			]

			let result = filterPeople(people, "")

			expect(result.map(p => p.name)).toEqual(["Alice"])
		})
	})
})
