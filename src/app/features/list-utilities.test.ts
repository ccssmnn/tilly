import { describe, test, expect } from "vitest"
import {
	removeHashtagFromSummary,
	addHashtagToSummary,
	replaceHashtagInSummary,
	extractHashtags,
	hasHashtag,
	extractListFilterFromQuery,
	setListFilterInQuery,
} from "#app/features/list-utilities"

describe("removeHashtagFromSummary", () => {
	test("removes hashtag from end of summary", () => {
		expect(removeHashtagFromSummary("Great person #friends", "#friends")).toBe(
			"Great person",
		)
	})

	test("removes hashtag from middle of summary", () => {
		expect(removeHashtagFromSummary("Great #friends person", "#friends")).toBe(
			"Great person",
		)
	})

	test("removes hashtag from beginning of summary", () => {
		expect(removeHashtagFromSummary("#friends Great person", "#friends")).toBe(
			"Great person",
		)
	})

	test("preserves other hashtags", () => {
		expect(
			removeHashtagFromSummary("Great person #friends #family", "#friends"),
		).toBe("Great person #family")
	})

	test("preserves non-hashtag content", () => {
		expect(
			removeHashtagFromSummary(
				"My best friend from college #friends",
				"#friends",
			),
		).toBe("My best friend from college")
	})

	test("handles case insensitive matching", () => {
		expect(removeHashtagFromSummary("Great person #Friends", "#friends")).toBe(
			"Great person",
		)
		expect(removeHashtagFromSummary("Great person #FRIENDS", "#friends")).toBe(
			"Great person",
		)
	})

	test("handles undefined summary", () => {
		expect(removeHashtagFromSummary(undefined, "#friends")).toBe("")
	})

	test("handles empty summary", () => {
		expect(removeHashtagFromSummary("", "#friends")).toBe("")
	})

	test("handles summary with only hashtag", () => {
		expect(removeHashtagFromSummary("#friends", "#friends")).toBe("")
	})

	test("handles multiple spaces around hashtag", () => {
		expect(
			removeHashtagFromSummary("Great person  #friends  more text", "#friends"),
		).toBe("Great person more text")
	})
})

describe("addHashtagToSummary", () => {
	test("adds hashtag to existing summary", () => {
		expect(addHashtagToSummary("Great person", "#friends")).toBe(
			"Great person #friends",
		)
	})

	test("handles undefined summary", () => {
		expect(addHashtagToSummary(undefined, "#friends")).toBe("#friends")
	})

	test("handles empty summary", () => {
		expect(addHashtagToSummary("", "#friends")).toBe("#friends")
	})

	test("handles summary with only whitespace", () => {
		expect(addHashtagToSummary("   ", "#friends")).toBe("#friends")
	})

	test("adds hashtag to summary with existing hashtags", () => {
		expect(addHashtagToSummary("Great person #family", "#friends")).toBe(
			"Great person #family #friends",
		)
	})

	test("trims summary before adding", () => {
		expect(addHashtagToSummary("  Great person  ", "#friends")).toBe(
			"Great person #friends",
		)
	})
})

describe("replaceHashtagInSummary", () => {
	test("replaces hashtag at end", () => {
		expect(
			replaceHashtagInSummary(
				"Great person #friends",
				"#friends",
				"#bestfriends",
			),
		).toBe("Great person #bestfriends")
	})

	test("replaces hashtag at beginning", () => {
		expect(
			replaceHashtagInSummary(
				"#friends Great person",
				"#friends",
				"#bestfriends",
			),
		).toBe("#bestfriends Great person")
	})

	test("replaces hashtag in middle", () => {
		expect(
			replaceHashtagInSummary(
				"Great #friends person",
				"#friends",
				"#bestfriends",
			),
		).toBe("Great #bestfriends person")
	})

	test("preserves other content", () => {
		expect(
			replaceHashtagInSummary(
				"My best friend from college #friends",
				"#friends",
				"#bestfriends",
			),
		).toBe("My best friend from college #bestfriends")
	})

	test("preserves other hashtags", () => {
		expect(
			replaceHashtagInSummary(
				"Great person #friends #family",
				"#friends",
				"#bestfriends",
			),
		).toBe("Great person #bestfriends #family")
	})

	test("handles case insensitive matching", () => {
		expect(
			replaceHashtagInSummary(
				"Great person #Friends",
				"#friends",
				"#bestfriends",
			),
		).toBe("Great person #bestfriends")
		expect(
			replaceHashtagInSummary(
				"Great person #FRIENDS",
				"#friends",
				"#bestfriends",
			),
		).toBe("Great person #bestfriends")
	})

	test("handles undefined summary", () => {
		expect(replaceHashtagInSummary(undefined, "#friends", "#bestfriends")).toBe(
			"",
		)
	})

	test("handles empty summary", () => {
		expect(replaceHashtagInSummary("", "#friends", "#bestfriends")).toBe("")
	})

	test("replaces only word boundaries", () => {
		expect(
			replaceHashtagInSummary(
				"#friends #friendsforever",
				"#friends",
				"#besties",
			),
		).toBe("#besties #friendsforever")
	})
})

describe("extractHashtags", () => {
	test("extracts single hashtag", () => {
		expect(extractHashtags("Great person #family")).toEqual(["#family"])
	})

	test("extracts multiple hashtags", () => {
		expect(extractHashtags("Person #family #work #friends")).toEqual([
			"#family",
			"#work",
			"#friends",
		])
	})

	test("handles hashtag at beginning", () => {
		expect(extractHashtags("#work colleague")).toEqual(["#work"])
	})

	test("handles hashtag only", () => {
		expect(extractHashtags("#family")).toEqual(["#family"])
	})

	test("normalizes to lowercase", () => {
		expect(extractHashtags("Person #Family #WORK")).toEqual([
			"#family",
			"#work",
		])
	})

	test("handles hashtags with numbers", () => {
		expect(extractHashtags("Person #team2024")).toEqual(["#team2024"])
	})

	test("handles hashtags with underscores", () => {
		expect(extractHashtags("Person #best_friends")).toEqual(["#best_friends"])
	})

	test("returns empty array for no hashtags", () => {
		expect(extractHashtags("Just a regular person")).toEqual([])
	})

	test("returns empty array for undefined", () => {
		expect(extractHashtags(undefined)).toEqual([])
	})

	test("returns empty array for empty string", () => {
		expect(extractHashtags("")).toEqual([])
	})

	test("ignores hashtag-like patterns without space before", () => {
		expect(extractHashtags("email@example.com #valid")).toEqual(["#valid"])
	})
})

describe("hasHashtag", () => {
	test("returns true when person has hashtag", () => {
		expect(hasHashtag({ summary: "Great person #family" }, "#family")).toBe(
			true,
		)
	})

	test("returns false when person lacks hashtag", () => {
		expect(hasHashtag({ summary: "Great person #work" }, "#family")).toBe(false)
	})

	test("matches case insensitively", () => {
		expect(hasHashtag({ summary: "Person #Family" }, "#family")).toBe(true)
		expect(hasHashtag({ summary: "Person #family" }, "#FAMILY")).toBe(true)
	})

	test("returns false for undefined summary", () => {
		expect(hasHashtag({ summary: undefined }, "#family")).toBe(false)
	})

	test("returns false for empty summary", () => {
		expect(hasHashtag({ summary: "" }, "#family")).toBe(false)
	})

	test("finds hashtag among multiple", () => {
		expect(
			hasHashtag({ summary: "Person #work #family #friends" }, "#family"),
		).toBe(true)
	})

	test("does not match partial hashtags", () => {
		expect(hasHashtag({ summary: "Person #familytime" }, "#family")).toBe(false)
	})
})

describe("extractListFilterFromQuery", () => {
	test("extracts hashtag from start of query", () => {
		expect(extractListFilterFromQuery("#family john")).toBe("#family")
	})

	test("extracts hashtag when only hashtag", () => {
		expect(extractListFilterFromQuery("#work")).toBe("#work")
	})

	test("normalizes to lowercase", () => {
		expect(extractListFilterFromQuery("#Family")).toBe("#family")
	})

	test("returns null for no hashtag", () => {
		expect(extractListFilterFromQuery("john smith")).toBe(null)
	})

	test("returns null for empty query", () => {
		expect(extractListFilterFromQuery("")).toBe(null)
	})

	test("ignores hashtag not at start", () => {
		expect(extractListFilterFromQuery("john #family")).toBe(null)
	})

	test("handles hashtag with trailing spaces", () => {
		expect(extractListFilterFromQuery("#work   ")).toBe("#work")
	})
})

describe("setListFilterInQuery", () => {
	test("adds filter to empty query", () => {
		expect(setListFilterInQuery("", "#family")).toBe("#family")
	})

	test("adds filter to existing query", () => {
		expect(setListFilterInQuery("john", "#family")).toBe("#family john")
	})

	test("replaces existing filter", () => {
		expect(setListFilterInQuery("#work john", "#family")).toBe("#family john")
	})

	test("removes filter when null", () => {
		expect(setListFilterInQuery("#work john", null)).toBe("john")
	})

	test("returns empty when removing filter from filter-only query", () => {
		expect(setListFilterInQuery("#work", null)).toBe("")
	})

	test("preserves search terms when changing filter", () => {
		expect(setListFilterInQuery("#work john smith", "#family")).toBe(
			"#family john smith",
		)
	})
})
