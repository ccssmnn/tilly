import { describe, test, expect } from "vitest"
import { isPascalCase } from "../../utils/component-detection.js"

describe("isPascalCase", () => {
	test("PascalCase names", () => {
		expect(isPascalCase("NoteListItem")).toBe(true)
		expect(isPascalCase("Button")).toBe(true)
		expect(isPascalCase("A")).toBe(true)
	})

	test("non-PascalCase names", () => {
		expect(isPascalCase("noteListItem")).toBe(false)
		expect(isPascalCase("useNotes")).toBe(false)
		expect(isPascalCase("formatDate")).toBe(false)
		expect(isPascalCase("_private")).toBe(false)
	})
})
