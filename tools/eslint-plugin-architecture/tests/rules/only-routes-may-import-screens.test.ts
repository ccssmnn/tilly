import { ruleTester } from "../rule-tester.js"
import rule from "../../rules/only-routes-may-import-screens.js"

ruleTester.run("only-routes-may-import-screens", rule, {
	valid: [
		{
			code: `import { NotesScreen } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/routes/_app.notes.tsx",
		},
		{
			// feature index re-exports screens
			code: `import { NotesScreen } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/features/notes/index.ts",
		},
		{
			// non-screen import is fine from anywhere
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// type-only import exempt
			code: `import type { ScreenProps } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/features/notes/widgets/NoteWidget.tsx",
		},
	],
	invalid: [
		{
			code: `import { NotesScreen } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/features/notes/widgets/NoteWidget.tsx",
			errors: [{ messageId: "forbidden" }],
		},
		{
			code: `import { NotesScreen } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/components/SomeComponent.tsx",
			errors: [{ messageId: "forbidden" }],
		},
		{
			code: `import { NotesScreen } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [{ messageId: "forbidden" }],
		},
	],
})
