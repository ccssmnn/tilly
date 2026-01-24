import { describe, test, expect } from "vitest"
import { filterNotes, filterPersonNotes } from "#app/features/note-filters"

type MockNote = {
	content: string
	pinned?: boolean
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	createdAt?: Date
	$jazz: { createdAt: number; lastUpdatedAt: number }
}

type MockPerson = {
	name: string
	summary?: string
}

type MockPair = {
	note: MockNote
	person: MockPerson
}

function createNote(content: string, overrides?: Partial<MockNote>): MockNote {
	let now = Date.now()
	return {
		content,
		createdAt: new Date(now),
		$jazz: { createdAt: now, lastUpdatedAt: now },
		...overrides,
	}
}

function createPair(
	noteContent: string,
	personName: string,
	noteOverrides?: Partial<MockNote>,
	personOverrides?: Partial<MockPerson>,
): MockPair {
	return {
		note: createNote(noteContent, noteOverrides),
		person: { name: personName, ...personOverrides },
	}
}

describe("filterNotes", () => {
	describe("list filtering with hashtags", () => {
		test("filters by person hashtag", () => {
			let pairs = [
				createPair("Birthday plans", "Mom", {}, { summary: "#family" }),
				createPair("Project notes", "Boss", {}, { summary: "#work" }),
				createPair("Gift ideas", "Dad", {}, { summary: "#family" }),
			]

			let result = filterNotes(pairs, "", {
				listFilter: "#family",
				statusFilter: "active",
			})

			expect(result.notes.map(p => p.note.content).sort()).toEqual([
				"Birthday plans",
				"Gift ideas",
			])
		})

		test("returns all when no list filter", () => {
			let pairs = [
				createPair("Note 1", "Person1", {}, { summary: "#family" }),
				createPair("Note 2", "Person2", {}, { summary: "#work" }),
			]

			let result = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.notes).toHaveLength(2)
		})

		test("matches hashtag case-insensitively", () => {
			let pairs = [
				createPair("Note 1", "Person", {}, { summary: "#Family" }),
				createPair("Note 2", "Person", {}, { summary: "#FAMILY" }),
			]

			let result = filterNotes(pairs, "", {
				listFilter: "#family",
				statusFilter: "active",
			})

			expect(result.notes).toHaveLength(2)
		})
	})

	describe("search filtering", () => {
		test("filters by note content", () => {
			let pairs = [
				createPair("Birthday party planning", "Mom"),
				createPair("Project deadline", "Boss"),
			]

			let result = filterNotes(pairs, "birthday", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.notes.map(p => p.note.content)).toEqual([
				"Birthday party planning",
			])
		})

		test("filters by person name", () => {
			let pairs = [
				createPair("Some note", "Alice"),
				createPair("Another note", "Bob"),
			]

			let result = filterNotes(pairs, "alice", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.notes.map(p => p.note.content)).toEqual(["Some note"])
		})

		test("search is case-insensitive", () => {
			let pairs = [createPair("IMPORTANT note", "Person")]

			let result = filterNotes(pairs, "important", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.notes).toHaveLength(1)
		})
	})

	describe("status filtering", () => {
		test("filters active notes", () => {
			let pairs = [
				createPair("Active note", "Person"),
				createPair("Deleted note", "Person", { deletedAt: new Date() }),
			]

			let result = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.notes.map(p => p.note.content)).toEqual(["Active note"])
		})

		test("filters deleted notes", () => {
			let pairs = [
				createPair("Active note", "Person"),
				createPair("Deleted note", "Person", { deletedAt: new Date() }),
			]

			let result = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "deleted",
			})

			expect(result.notes.map(p => p.note.content)).toEqual(["Deleted note"])
		})

		test("excludes permanently deleted from both", () => {
			let pairs = [
				createPair("Active", "Person"),
				createPair("Deleted", "Person", { deletedAt: new Date() }),
				createPair("Permanent", "Person", { permanentlyDeletedAt: new Date() }),
			]

			let activeResult = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})
			let deletedResult = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "deleted",
			})

			expect(activeResult.notes.map(p => p.note.content)).toEqual(["Active"])
			expect(deletedResult.notes.map(p => p.note.content)).toEqual(["Deleted"])
		})
	})

	describe("sorting", () => {
		test("sorts active notes by created date descending", () => {
			let now = Date.now()
			let pairs = [
				createPair("Old", "P", {
					createdAt: new Date(now - 2000),
					$jazz: { createdAt: now - 2000, lastUpdatedAt: now - 2000 },
				}),
				createPair("New", "P", {
					createdAt: new Date(now),
					$jazz: { createdAt: now, lastUpdatedAt: now },
				}),
				createPair("Middle", "P", {
					createdAt: new Date(now - 1000),
					$jazz: { createdAt: now - 1000, lastUpdatedAt: now - 1000 },
				}),
			]

			let result = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.notes.map(p => p.note.content)).toEqual([
				"New",
				"Middle",
				"Old",
			])
		})
	})

	describe("total count", () => {
		test("returns total count before filtering", () => {
			let pairs = [
				createPair("Active", "P"),
				createPair("Deleted", "P", { deletedAt: new Date() }),
			]

			let result = filterNotes(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.total).toBe(2)
			expect(result.notes).toHaveLength(1)
		})
	})
})

describe("filterPersonNotes", () => {
	test("filters by search query", () => {
		let notes = [createNote("Birthday party"), createNote("Project meeting")]

		let result = filterPersonNotes(notes, "birthday", {
			statusFilter: "active",
		})

		expect(result.map(n => n.content)).toEqual(["Birthday party"])
	})

	test("filters by status", () => {
		let notes = [
			createNote("Active"),
			createNote("Deleted", { deletedAt: new Date() }),
		]

		let result = filterPersonNotes(notes, "", { statusFilter: "deleted" })

		expect(result.map(n => n.content)).toEqual(["Deleted"])
	})

	test("puts pinned notes first for active status", () => {
		let now = Date.now()
		let notes = [
			createNote("Regular", {
				createdAt: new Date(now),
				$jazz: { createdAt: now, lastUpdatedAt: now },
			}),
			createNote("Pinned", {
				pinned: true,
				createdAt: new Date(now - 1000),
				$jazz: { createdAt: now - 1000, lastUpdatedAt: now - 1000 },
			}),
		]

		let result = filterPersonNotes(notes, "", { statusFilter: "active" })

		expect(result.map(n => n.content)).toEqual(["Pinned", "Regular"])
	})

	test("defaults to active status", () => {
		let notes = [
			createNote("Active"),
			createNote("Deleted", { deletedAt: new Date() }),
		]

		let result = filterPersonNotes(notes, "")

		expect(result.map(n => n.content)).toEqual(["Active"])
	})
})
