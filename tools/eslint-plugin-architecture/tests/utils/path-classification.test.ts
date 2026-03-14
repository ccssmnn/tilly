import { describe, test, expect } from "vitest"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
} from "../../src/utils/path-classification.js"

describe("classifyFile", () => {
	test("screen", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/screens/NotesScreen.tsx",
		)
		expect(result).toEqual({ zone: "screen", feature: "notes" })
	})

	test("widget", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/widgets/NotePreview.tsx",
		)
		expect(result).toEqual({ zone: "widget", feature: "notes" })
	})

	test("part", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/parts/NoteListItem.tsx",
		)
		expect(result).toEqual({ zone: "part", feature: "notes" })
	})

	test("hook", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/hooks/useNotes.ts",
		)
		expect(result).toEqual({ zone: "hook", feature: "notes" })
	})

	test("feature-lib", () => {
		let result = classifyFile("/project/src/app/features/notes/lib/utils.ts")
		expect(result).toEqual({ zone: "feature-lib", feature: "notes" })
	})

	test("feature-index", () => {
		let result = classifyFile("/project/src/app/features/notes/index.ts")
		expect(result).toEqual({ zone: "feature-index", feature: "notes" })
	})

	test("app-component", () => {
		let result = classifyFile("/project/src/app/components/navigation.tsx")
		expect(result).toEqual({ zone: "app-component", feature: null })
	})

	test("shared-ui", () => {
		let result = classifyFile("/project/src/shared/ui/button.tsx")
		expect(result).toEqual({ zone: "shared-ui", feature: null })
	})

	test("route", () => {
		let result = classifyFile("/project/src/app/routes/__root.tsx")
		expect(result).toEqual({ zone: "route", feature: null })
	})

	test("handler", () => {
		let result = classifyFile(
			"/project/src/server/features/push/handlers/register.ts",
		)
		expect(result).toEqual({ zone: "handler", feature: "push" })
	})

	test("use-case", () => {
		let result = classifyFile(
			"/project/src/server/features/push/use-cases/send-push.ts",
		)
		expect(result).toEqual({ zone: "use-case", feature: "push" })
	})

	test("operation", () => {
		let result = classifyFile(
			"/project/src/server/features/push/operations/create-token.ts",
		)
		expect(result).toEqual({ zone: "operation", feature: "push" })
	})

	test("flat feature file classifies as unknown with feature name", () => {
		let result = classifyFile("/project/src/app/features/notes/note-form.tsx")
		expect(result).toEqual({ zone: "unknown", feature: "notes" })
	})

	test("completely unknown path", () => {
		let result = classifyFile("/project/src/lib/utils.ts")
		expect(result).toEqual({ zone: "unknown", feature: null })
	})

	test("nested part", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/parts/list/NoteListItem.tsx",
		)
		expect(result).toEqual({ zone: "part", feature: "notes" })
	})
})

describe("classifyImport", () => {
	let file = "/project/src/app/features/notes/screens/NotesScreen.tsx"

	test("alias import to parts", () => {
		let result = classifyImport(
			"#app/features/notes/parts/NoteItem",
			file,
			DEFAULT_ALIASES,
		)
		expect(result).toEqual({ zone: "part", feature: "notes" })
	})

	test("alias import to feature index (bare)", () => {
		let result = classifyImport("#app/features/people", file, DEFAULT_ALIASES)
		expect(result).toEqual({ zone: "feature-index", feature: "people" })
	})

	test("alias import to feature index (explicit)", () => {
		let result = classifyImport(
			"#app/features/people/index",
			file,
			DEFAULT_ALIASES,
		)
		expect(result).toEqual({ zone: "feature-index", feature: "people" })
	})

	test("alias import to shared ui", () => {
		let result = classifyImport("#shared/ui/button", file, DEFAULT_ALIASES)
		expect(result).toEqual({ zone: "shared-ui", feature: null })
	})

	test("relative import within same feature", () => {
		let result = classifyImport("../parts/NoteItem", file, DEFAULT_ALIASES)
		expect(result).toEqual({ zone: "part", feature: "notes" })
	})

	test("package import returns unknown", () => {
		let result = classifyImport("react", file, DEFAULT_ALIASES)
		expect(result).toEqual({ zone: "unknown", feature: null })
	})
})

describe("isSameFeature", () => {
	test("same feature", () => {
		expect(
			isSameFeature(
				{ zone: "screen", feature: "notes" },
				{ zone: "part", feature: "notes" },
			),
		).toBe(true)
	})

	test("different features", () => {
		expect(
			isSameFeature(
				{ zone: "screen", feature: "notes" },
				{ zone: "part", feature: "people" },
			),
		).toBe(false)
	})

	test("null feature", () => {
		expect(
			isSameFeature(
				{ zone: "route", feature: null },
				{ zone: "screen", feature: "notes" },
			),
		).toBe(false)
	})
})
