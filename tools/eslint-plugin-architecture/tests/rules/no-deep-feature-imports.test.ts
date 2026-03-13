import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-deep-feature-imports.js"

ruleTester.run("no-deep-feature-imports", rule, {
	valid: [
		{
			code: `import { Note } from "#app/features/notes"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
		},
		{
			code: `import { Note } from "#app/features/notes/index"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
		},
		{
			// same-feature deep import is fine
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			code: `import { Button } from "#shared/ui/button"`,
			filename: "/project/src/app/features/notes/parts/NoteItem.tsx",
		},
		{
			code: `import React from "react"`,
			filename: "/project/src/app/features/notes/parts/NoteItem.tsx",
		},
		{
			// type-only imports are exempt
			code: `import type { Note } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
		},
		{
			// routes may deep-import screens
			code: `import { NotesScreen } from "#app/features/notes/screens/NotesScreen"`,
			filename: "/project/src/app/routes/_app.notes.tsx",
		},
	],
	invalid: [
		{
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [{ messageId: "noDeepImport" }],
		},
		{
			code: `import { useNotes } from "#app/features/notes/hooks/useNotes"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [{ messageId: "noDeepImport" }],
		},
		{
			code: `import { noteUtils } from "#app/features/notes/lib/utils"`,
			filename: "/project/src/app/features/people/lib/utils.ts",
			errors: [{ messageId: "noDeepImport" }],
		},
		{
			code: `import { NotesWidget } from "#app/features/notes/widgets/NotesWidget"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [{ messageId: "noDeepImport" }],
		},
	],
})
