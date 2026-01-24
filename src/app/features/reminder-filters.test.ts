import { describe, test, expect } from "vitest"
import {
	filterReminders,
	filterPersonReminders,
} from "#app/features/reminder-filters"

type MockReminder = {
	text: string
	done: boolean
	dueAtDate: string
	deletedAt?: Date
	permanentlyDeletedAt?: Date
	updatedAt?: Date
	createdAt?: Date
	$jazz: { lastUpdatedAt: number; createdAt: number }
}

type MockPerson = {
	name: string
	summary?: string
}

type MockPair = {
	reminder: MockReminder
	person: MockPerson
}

function createReminder(
	text: string,
	overrides?: Partial<MockReminder>,
): MockReminder {
	let now = Date.now()
	return {
		text,
		done: false,
		dueAtDate: new Date().toISOString(),
		createdAt: new Date(now),
		$jazz: { lastUpdatedAt: now, createdAt: now },
		...overrides,
	}
}

function createPair(
	reminderText: string,
	personName: string,
	reminderOverrides?: Partial<MockReminder>,
	personOverrides?: Partial<MockPerson>,
): MockPair {
	return {
		reminder: createReminder(reminderText, reminderOverrides),
		person: { name: personName, ...personOverrides },
	}
}

describe("filterReminders", () => {
	describe("list filtering with hashtags", () => {
		test("filters by person hashtag", () => {
			let pairs = [
				createPair("Call mom", "Mom", {}, { summary: "#family" }),
				createPair("Meeting", "Boss", {}, { summary: "#work" }),
				createPair("Dinner", "Dad", {}, { summary: "#family" }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: "#family",
				statusFilter: "active",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual([
				"Call mom",
				"Dinner",
			])
		})

		test("returns all when no list filter", () => {
			let pairs = [
				createPair("Call mom", "Mom", {}, { summary: "#family" }),
				createPair("Meeting", "Boss", {}, { summary: "#work" }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.reminders).toHaveLength(2)
		})
	})

	describe("search filtering", () => {
		test("filters by reminder text", () => {
			let pairs = [
				createPair("Call mom", "Mom"),
				createPair("Email boss", "Boss"),
			]

			let result = filterReminders(pairs, "call", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual(["Call mom"])
		})

		test("filters by person name", () => {
			let pairs = [createPair("Call", "Mom"), createPair("Email", "Boss")]

			let result = filterReminders(pairs, "mom", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual(["Call"])
		})
	})

	describe("status filtering", () => {
		test("filters active reminders", () => {
			let pairs = [
				createPair("Active task", "Person"),
				createPair("Done task", "Person", { done: true }),
				createPair("Deleted task", "Person", { deletedAt: new Date() }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual([
				"Active task",
			])
		})

		test("filters done reminders", () => {
			let pairs = [
				createPair("Active task", "Person"),
				createPair("Done task", "Person", { done: true }),
				createPair("Deleted task", "Person", { deletedAt: new Date() }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "done",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual(["Done task"])
		})

		test("filters deleted reminders", () => {
			let pairs = [
				createPair("Active task", "Person"),
				createPair("Done task", "Person", { done: true }),
				createPair("Deleted task", "Person", { deletedAt: new Date() }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "deleted",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual([
				"Deleted task",
			])
		})

		test("excludes permanently deleted from deleted filter", () => {
			let pairs = [
				createPair("Deleted task", "Person", { deletedAt: new Date() }),
				createPair("Permanently deleted", "Person", {
					deletedAt: new Date(),
					permanentlyDeletedAt: new Date(),
				}),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "deleted",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual([
				"Deleted task",
			])
		})
	})

	describe("sorting", () => {
		test("sorts active reminders by due date ascending", () => {
			let now = Date.now()
			let pairs = [
				createPair("Later", "P", {
					dueAtDate: new Date(now + 2000).toISOString(),
				}),
				createPair("Soon", "P", {
					dueAtDate: new Date(now + 1000).toISOString(),
				}),
				createPair("Now", "P", { dueAtDate: new Date(now).toISOString() }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual([
				"Now",
				"Soon",
				"Later",
			])
		})

		test("sorts done reminders by updated date descending", () => {
			let now = Date.now()
			let pairs = [
				createPair("Old", "P", {
					done: true,
					updatedAt: new Date(now - 2000),
				}),
				createPair("Recent", "P", {
					done: true,
					updatedAt: new Date(now),
				}),
				createPair("Middle", "P", {
					done: true,
					updatedAt: new Date(now - 1000),
				}),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "done",
			})

			expect(result.reminders.map(p => p.reminder.text)).toEqual([
				"Recent",
				"Middle",
				"Old",
			])
		})
	})

	describe("total count", () => {
		test("returns total count of all pairs before filtering", () => {
			let pairs = [
				createPair("Active", "P"),
				createPair("Done", "P", { done: true }),
				createPair("Deleted", "P", { deletedAt: new Date() }),
			]

			let result = filterReminders(pairs, "", {
				listFilter: null,
				statusFilter: "active",
			})

			expect(result.total).toBe(3)
			expect(result.reminders).toHaveLength(1)
		})
	})
})

describe("filterPersonReminders", () => {
	test("filters by search query", () => {
		let reminders = [createReminder("Call mom"), createReminder("Email boss")]

		let result = filterPersonReminders(reminders, "call", {
			statusFilter: "active",
		})

		expect(result.map(r => r.text)).toEqual(["Call mom"])
	})

	test("filters by status", () => {
		let reminders = [
			createReminder("Active"),
			createReminder("Done", { done: true }),
			createReminder("Deleted", { deletedAt: new Date() }),
		]

		let result = filterPersonReminders(reminders, "", {
			statusFilter: "done",
		})

		expect(result.map(r => r.text)).toEqual(["Done"])
	})

	test("defaults to active status", () => {
		let reminders = [
			createReminder("Active"),
			createReminder("Done", { done: true }),
		]

		let result = filterPersonReminders(reminders, "")

		expect(result.map(r => r.text)).toEqual(["Active"])
	})
})
