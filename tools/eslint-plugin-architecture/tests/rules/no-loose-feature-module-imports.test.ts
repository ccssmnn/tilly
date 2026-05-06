import { vi } from "vitest"
import fs from "node:fs"

let featureFolders = new Set([
	"/project/src/app/features/notes",
	"/project/src/app/features/people",
	"/project/src/app/features/reminders",
	"/project/src/app/features/settings",
	"/project/src/app/features/assistant",
	"/project/src/app/features/tour",
])

vi.spyOn(fs, "existsSync").mockImplementation(
	(p: fs.PathLike) =>
		featureFolders.has(String(p)) || String(p) === "/project/src",
)
vi.spyOn(fs, "statSync").mockImplementation(
	(p: fs.PathOrFileDescriptor) =>
		({
			isDirectory: () => featureFolders.has(String(p)),
		}) as fs.Stats,
)

import { ruleTester } from "../rule-tester.js"
import rule from "../../rules/no-loose-feature-module-imports.js"

ruleTester.run("no-loose-feature-module-imports", rule, {
	valid: [
		{
			code: `import { Note } from "#app/features/notes"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
		},
		{
			code: `import { Button } from "#shared/ui/button"`,
			filename: "/project/src/app/features/notes/widgets/NoteWidget.tsx",
		},
		{
			code: `import React from "react"`,
			filename: "/project/src/app/features/notes/parts/NoteItem.tsx",
		},
		{
			code: `import type { NoteForm } from "#app/features/note-form"`,
			filename: "/project/src/app/features/notes/widgets/NoteWidget.tsx",
		},
		{
			// deep imports are not this rule's concern
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
	],
	invalid: [
		{
			code: `import { NoteForm } from "#app/features/note-form"`,
			filename: "/project/src/app/features/notes/widgets/NoteWidget.tsx",
			errors: [
				{
					messageId: "noLooseImport",
					data: { module: "note-form" },
				},
			],
		},
		{
			code: `import { PersonDetails } from "#app/features/person-details"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [
				{
					messageId: "noLooseImport",
					data: { module: "person-details" },
				},
			],
		},
		{
			code: `import { PersonSelector } from "#app/features/person-selector"`,
			filename: "/project/src/app/routes/_app.tsx",
			errors: [
				{
					messageId: "noLooseImport",
					data: { module: "person-selector" },
				},
			],
		},
		{
			code: `import { ListForm } from "./list-form"`,
			filename: "/project/src/app/features/note-form.tsx",
			errors: [
				{
					messageId: "noLooseImport",
					data: { module: "list-form" },
				},
			],
		},
	],
})
