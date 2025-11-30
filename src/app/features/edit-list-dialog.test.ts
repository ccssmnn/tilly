import { describe, test, expect } from "vitest"
import { _test } from "./edit-list-dialog"

let { removeHashtagFromSummary, addHashtagToSummary, replaceHashtagInSummary } =
	_test

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
