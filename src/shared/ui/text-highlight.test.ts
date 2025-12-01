import { describe, test, expect } from "vitest"

function extractSearchTerms(query: string): string[] {
	let trimmed = query.trim()
	let terms: string[] = []
	let hashtagMatch = trimmed.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (hashtagMatch) {
		terms.push(hashtagMatch[1])
	}
	let searchWithoutFilter = trimmed.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (searchWithoutFilter) {
		terms.push(searchWithoutFilter)
	}
	return terms
}

describe("extractSearchTerms", () => {
	test("extracts hashtag and search term from combined query", () => {
		expect(extractSearchTerms("#family mom")).toEqual(["#family", "mom"])
	})

	test("extracts only search term when no hashtag", () => {
		expect(extractSearchTerms("mom")).toEqual(["mom"])
	})

	test("extracts only hashtag when no search term", () => {
		expect(extractSearchTerms("#family")).toEqual(["#family"])
	})

	test("handles hashtag with extra spaces", () => {
		expect(extractSearchTerms("#family   mom")).toEqual(["#family", "mom"])
	})

	test("handles multi-word search term", () => {
		expect(extractSearchTerms("#work project manager")).toEqual([
			"#work",
			"project manager",
		])
	})

	test("returns empty array for empty query", () => {
		expect(extractSearchTerms("")).toEqual([])
	})

	test("returns empty array for whitespace only", () => {
		expect(extractSearchTerms("   ")).toEqual([])
	})

	test("handles hashtag with numbers", () => {
		expect(extractSearchTerms("#family2023 reunion")).toEqual([
			"#family2023",
			"reunion",
		])
	})

	test("handles hashtag with underscores", () => {
		expect(extractSearchTerms("#best_friends party")).toEqual([
			"#best_friends",
			"party",
		])
	})

	test("only extracts first hashtag as filter", () => {
		expect(extractSearchTerms("#family #friends mom")).toEqual([
			"#family",
			"#friends mom",
		])
	})

	test("handles case sensitivity in hashtag", () => {
		expect(extractSearchTerms("#Family mom")).toEqual(["#Family", "mom"])
	})

	test("handles trailing whitespace", () => {
		expect(extractSearchTerms("#family mom  ")).toEqual(["#family", "mom"])
	})

	test("handles leading whitespace", () => {
		expect(extractSearchTerms("  #family mom")).toEqual(["#family", "mom"])
	})

	test("trims search term properly", () => {
		expect(extractSearchTerms("#work  project  ")).toEqual(["#work", "project"])
	})
})
