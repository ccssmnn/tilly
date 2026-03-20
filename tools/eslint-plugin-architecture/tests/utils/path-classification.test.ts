import { describe, test, expect } from "vitest"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
} from "../../src/utils/path-classification.js"

describe("classifyFile", () => {
	test("screen", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/screens/NotesScreen.tsx",
		)
		expect(result).toEqual({
			zone: "screen",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("widget", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/widgets/NotePreview.tsx",
		)
		expect(result).toEqual({
			zone: "widget",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("part", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/parts/NoteListItem.tsx",
		)
		expect(result).toEqual({
			zone: "part",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("hook", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/hooks/useNotes.ts",
		)
		expect(result).toEqual({
			zone: "hook",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("feature-lib", () => {
		let result = classifyFile("/project/src/app/features/notes/lib/utils.ts")
		expect(result).toEqual({
			zone: "feature-lib",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("feature-index", () => {
		let result = classifyFile("/project/src/app/features/notes/index.ts")
		expect(result).toEqual({
			zone: "feature-index",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("app-component", () => {
		let result = classifyFile("/project/src/app/components/navigation.tsx")
		expect(result).toEqual({ zone: "app-component", feature: null, root: null })
	})

	test("shared-ui", () => {
		let result = classifyFile("/project/src/shared/ui/button.tsx")
		expect(result).toEqual({ zone: "shared-ui", feature: null, root: null })
	})

	test("route", () => {
		let result = classifyFile("/project/src/app/routes/__root.tsx")
		expect(result).toEqual({ zone: "route", feature: null, root: null })
	})

	test("handler", () => {
		let result = classifyFile(
			"/project/src/server/features/push/handlers/register.ts",
		)
		expect(result).toEqual({
			zone: "handler",
			feature: "push",
			root: "src/server/features",
		})
	})

	test("operation", () => {
		let result = classifyFile(
			"/project/src/server/features/push/operations/send-push.ts",
		)
		expect(result).toEqual({
			zone: "operation",
			feature: "push",
			root: "src/server/features",
		})
	})

	test("server parts are excluded (use lib instead)", () => {
		let result = classifyFile(
			"/project/src/server/features/push/parts/send-notification.ts",
		)
		expect(result).toEqual({
			zone: "unknown",
			feature: "push",
			root: "src/server/features",
		})
	})

	test("server lib", () => {
		let result = classifyFile(
			"/project/src/server/features/push/lib/web-push.ts",
		)
		expect(result).toEqual({
			zone: "feature-lib",
			feature: "push",
			root: "src/server/features",
		})
	})

	test("server feature-index", () => {
		let result = classifyFile("/project/src/server/features/push/index.ts")
		expect(result).toEqual({
			zone: "feature-index",
			feature: "push",
			root: "src/server/features",
		})
	})

	test("server middleware", () => {
		let result = classifyFile(
			"/project/src/server/features/auth/middleware/auth.ts",
		)
		expect(result).toEqual({
			zone: "middleware",
			feature: "auth",
			root: "src/server/features",
		})
	})

	test("server apps", () => {
		let result = classifyFile(
			"/project/src/server/features/chat/apps/chat-app.ts",
		)
		expect(result).toEqual({
			zone: "app",
			feature: "chat",
			root: "src/server/features",
		})
	})

	test("middleware in app features are unknown", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/middleware/something.ts",
		)
		expect(result).toEqual({
			zone: "unknown",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("apps in app features are unknown", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/apps/something.ts",
		)
		expect(result).toEqual({
			zone: "unknown",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("operations in app features are unknown", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/operations/something.ts",
		)
		expect(result).toEqual({
			zone: "unknown",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("handlers in app features are unknown", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/handlers/something.ts",
		)
		expect(result).toEqual({
			zone: "unknown",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("flat feature file classifies as unknown with feature name", () => {
		let result = classifyFile("/project/src/app/features/notes/note-form.tsx")
		expect(result).toEqual({
			zone: "unknown",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("completely unknown path", () => {
		let result = classifyFile("/project/src/lib/utils.ts")
		expect(result).toEqual({ zone: "unknown", feature: null, root: null })
	})

	test("nested part", () => {
		let result = classifyFile(
			"/project/src/app/features/notes/parts/list/NoteListItem.tsx",
		)
		expect(result).toEqual({
			zone: "part",
			feature: "notes",
			root: "src/app/features",
		})
	})
})

describe("classifyFile with custom feature roots", () => {
	let customRoots = [
		{
			path: "src/shared/features",
			allowedZones: ["lib"],
		},
	]

	test("classifies shared feature lib", () => {
		let result = classifyFile(
			"/project/src/shared/features/sync/lib/utils.ts",
			customRoots,
		)
		expect(result).toEqual({
			zone: "feature-lib",
			feature: "sync",
			root: "src/shared/features",
		})
	})

	test("shared feature index", () => {
		let result = classifyFile(
			"/project/src/shared/features/sync/index.ts",
			customRoots,
		)
		expect(result).toEqual({
			zone: "feature-index",
			feature: "sync",
			root: "src/shared/features",
		})
	})

	test("unrecognized zone in custom root is unknown", () => {
		let result = classifyFile(
			"/project/src/shared/features/sync/screens/foo.tsx",
			customRoots,
		)
		expect(result).toEqual({
			zone: "unknown",
			feature: "sync",
			root: "src/shared/features",
		})
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
		expect(result).toEqual({
			zone: "part",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("alias import to feature index (bare)", () => {
		let result = classifyImport("#app/features/people", file, DEFAULT_ALIASES)
		expect(result).toEqual({
			zone: "feature-index",
			feature: "people",
			root: "src/app/features",
		})
	})

	test("alias import to feature index (explicit)", () => {
		let result = classifyImport(
			"#app/features/people/index",
			file,
			DEFAULT_ALIASES,
		)
		expect(result).toEqual({
			zone: "feature-index",
			feature: "people",
			root: "src/app/features",
		})
	})

	test("alias import to shared ui", () => {
		let result = classifyImport("#shared/ui/button", file, DEFAULT_ALIASES)
		expect(result).toEqual({ zone: "shared-ui", feature: null, root: null })
	})

	test("relative import within same feature", () => {
		let result = classifyImport("../parts/NoteItem", file, DEFAULT_ALIASES)
		expect(result).toEqual({
			zone: "part",
			feature: "notes",
			root: "src/app/features",
		})
	})

	test("package import returns unknown", () => {
		let result = classifyImport("react", file, DEFAULT_ALIASES)
		expect(result).toEqual({ zone: "unknown", feature: null, root: null })
	})

	test("alias import to server operation", () => {
		let serverFile =
			"/project/src/server/features/push/handlers/push-handler.ts"
		let result = classifyImport(
			"#server/features/push/operations/send-push",
			serverFile,
			DEFAULT_ALIASES,
		)
		expect(result).toEqual({
			zone: "operation",
			feature: "push",
			root: "src/server/features",
		})
	})

	test("alias import to server feature index (bare)", () => {
		let serverFile =
			"/project/src/server/features/chat/handlers/chat-handler.ts"
		let result = classifyImport(
			"#server/features/push",
			serverFile,
			DEFAULT_ALIASES,
		)
		expect(result).toEqual({
			zone: "feature-index",
			feature: "push",
			root: "src/server/features",
		})
	})
})

describe("classifyImport with custom feature roots", () => {
	let customRoots = [
		...DEFAULT_FEATURE_ROOTS,
		{ path: "src/shared/features", allowedZones: ["lib"] },
	]
	let aliases = { ...DEFAULT_ALIASES }

	test("alias import to custom root feature index", () => {
		let file = "/project/src/app/features/notes/screens/NotesScreen.tsx"
		let result = classifyImport(
			"#shared/features/sync",
			file,
			aliases,
			customRoots,
		)
		expect(result).toEqual({
			zone: "feature-index",
			feature: "sync",
			root: "src/shared/features",
		})
	})

	test("alias import to custom root lib", () => {
		let file = "/project/src/app/features/notes/screens/NotesScreen.tsx"
		let result = classifyImport(
			"#shared/features/sync/lib/utils",
			file,
			aliases,
			customRoots,
		)
		expect(result).toEqual({
			zone: "feature-lib",
			feature: "sync",
			root: "src/shared/features",
		})
	})
})

describe("isSameFeature", () => {
	test("same feature", () => {
		expect(
			isSameFeature(
				{ zone: "screen", feature: "notes", root: "src/app/features" },
				{ zone: "part", feature: "notes", root: "src/app/features" },
			),
		).toBe(true)
	})

	test("different features", () => {
		expect(
			isSameFeature(
				{ zone: "screen", feature: "notes", root: "src/app/features" },
				{ zone: "part", feature: "people", root: "src/app/features" },
			),
		).toBe(false)
	})

	test("null feature", () => {
		expect(
			isSameFeature(
				{ zone: "route", feature: null, root: null },
				{ zone: "screen", feature: "notes", root: "src/app/features" },
			),
		).toBe(false)
	})
})
