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
		{
			// router may deep-import handlers
			code: `import { pushHandler } from "#server/features/push/handlers/push-handler"`,
			filename: "/project/src/server/main.ts",
		},
		{
			// same server feature deep import is fine
			code: `import { sendNotification } from "#server/features/push/parts/send-notification"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
		{
			// cross server feature via index
			code: `import { push } from "#server/features/push"`,
			filename: "/project/src/server/features/chat/handlers/chat-handler.ts",
		},
	],
	invalid: [
		{
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [
				{
					messageId: "noDeepImport",
					data: { featurePath: "#app/features/notes" },
				},
			],
		},
		{
			code: `import { useNotes } from "#app/features/notes/hooks/useNotes"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [
				{
					messageId: "noDeepImport",
					data: { featurePath: "#app/features/notes" },
				},
			],
		},
		{
			code: `import { noteUtils } from "#app/features/notes/lib/utils"`,
			filename: "/project/src/app/features/people/lib/utils.ts",
			errors: [
				{
					messageId: "noDeepImport",
					data: { featurePath: "#app/features/notes" },
				},
			],
		},
		{
			code: `import { NotesWidget } from "#app/features/notes/widgets/NotesWidget"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [
				{
					messageId: "noDeepImport",
					data: { featurePath: "#app/features/notes" },
				},
			],
		},
		{
			// cross server feature deep import
			code: `import { sendNotification } from "#server/features/push/parts/send-notification"`,
			filename: "/project/src/server/features/chat/handlers/chat-handler.ts",
			errors: [
				{
					messageId: "noDeepImport",
					data: { featurePath: "#server/features/push" },
				},
			],
		},
	],
})
