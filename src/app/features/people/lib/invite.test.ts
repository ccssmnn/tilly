import { describe, expect, test } from "vitest"
import { parseInviteHash } from "./invite"

describe("parseInviteHash", () => {
	test("parses a valid invite hash", () => {
		let hash = "#/person/co_zABC123/invite/co_zDEF456/inviteSecret_zSECRET"
		let result = parseInviteHash(hash)
		expect(result).toEqual({
			personId: "co_zABC123",
			inviteGroupId: "co_zDEF456",
			inviteSecret: "inviteSecret_zSECRET",
		})
	})

	test("returns null for empty string", () => {
		expect(parseInviteHash("")).toBeNull()
	})

	test("returns null for hash without proper prefix", () => {
		expect(parseInviteHash("#/other/path")).toBeNull()
	})

	test("returns null when personId is missing co_ prefix", () => {
		expect(
			parseInviteHash("#/person/zABC/invite/co_zDEF/inviteSecret_zSEC"),
		).toBeNull()
	})

	test("returns null when inviteGroupId is missing co_ prefix", () => {
		expect(
			parseInviteHash("#/person/co_zABC/invite/zDEF/inviteSecret_zSEC"),
		).toBeNull()
	})

	test("returns null when inviteSecret is missing prefix", () => {
		expect(parseInviteHash("#/person/co_zABC/invite/co_zDEF/zSEC")).toBeNull()
	})

	test("returns null for trailing slash", () => {
		expect(
			parseInviteHash("#/person/co_zABC/invite/co_zDEF/inviteSecret_zSEC/"),
		).toBeNull()
	})

	test("returns null for extra path segments", () => {
		expect(
			parseInviteHash(
				"#/person/co_zABC/invite/co_zDEF/inviteSecret_zSEC/extra",
			),
		).toBeNull()
	})

	test("handles IDs with various characters after co_ prefix", () => {
		let hash =
			"#/person/co_zLongId123ABC/invite/co_zAnotherId999/inviteSecret_zVeryLongSecret"
		let result = parseInviteHash(hash)
		expect(result).not.toBeNull()
		expect(result!.personId).toBe("co_zLongId123ABC")
		expect(result!.inviteGroupId).toBe("co_zAnotherId999")
		expect(result!.inviteSecret).toBe("inviteSecret_zVeryLongSecret")
	})
})
