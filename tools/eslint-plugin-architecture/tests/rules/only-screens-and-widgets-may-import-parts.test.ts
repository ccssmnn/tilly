import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/only-screens-and-widgets-may-import-parts.js"

ruleTester.run("only-screens-and-widgets-may-import-parts", rule, {
	valid: [
		{
			// screen imports part — same feature
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// widget imports part — same feature
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/widgets/NotePreview.tsx",
		},
		{
			// handler imports lib — same feature (server)
			code: `import { sendNotification } from "#server/features/push/lib/send-notification"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
		{
			// operation imports lib — same feature (server)
			code: `import { formatPayload } from "#server/features/push/lib/format-payload"`,
			filename: "/project/src/server/features/push/operations/send-push.ts",
		},
		{
			// screen imports lib — same feature (client)
			code: `import { formatNote } from "#app/features/notes/lib/format"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// screen imports hook — same feature (client)
			code: `import { useNotes } from "#app/features/notes/hooks/useNotes"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// relative import from screen to part
			code: `import { NoteItem } from "../parts/NoteItem"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// non-leaf import is fine from anywhere
			code: `import { NoteItem } from "#app/features/notes"`,
			filename: "/project/src/app/features/notes/hooks/useOtherHook.ts",
		},
		{
			// type-only import exempt
			code: `import type { NoteItemProps } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/hooks/useNotes.ts",
		},
		{
			// type-only re-export exempt
			code: `export type { NoteItemProps } from "./parts/NoteItem"`,
			filename: "/project/src/app/features/notes/index.ts",
		},
		{
			// feature index may re-export from lib (public utility surface)
			code: `export { formatNote } from "./lib/format"`,
			filename: "/project/src/app/features/notes/index.ts",
		},
		{
			// feature index may re-export from hooks (public utility surface)
			code: `export { useNotes } from "./hooks/useNotes"`,
			filename: "/project/src/app/features/notes/index.ts",
		},
		{
			// feature index may star-re-export from lib
			code: `export * from "./lib/types"`,
			filename: "/project/src/app/features/notes/index.ts",
		},
		{
			// middleware imports lib — same feature (server)
			code: `import { clerkClient } from "../lib/clerk-client"`,
			filename: "/project/src/server/features/auth/middleware/auth.ts",
		},
	],
	invalid: [
		{
			// hook importing a part
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/hooks/useNotes.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// route importing a part directly
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/routes/_app.notes.tsx",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// cross-feature screen importing a part
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/people/screens/PeopleScreen.tsx",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// shared component importing a part
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/components/SomeComponent.tsx",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// feature index must not import parts
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/index.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// feature index must not re-export parts (parts stay strictly private)
			code: `export { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/index.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// feature index must not star-re-export parts
			code: `export * from "./parts/NoteItem"`,
			filename: "/project/src/app/features/notes/index.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// feature index may re-export lib but cannot import-then-rename it
			code: `import { formatNote } from "./lib/format"`,
			filename: "/project/src/app/features/notes/index.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// cross-feature operation importing lib
			code: `import { formatPayload } from "#server/features/push/lib/format-payload"`,
			filename: "/project/src/server/features/chat/operations/send-chat.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// hook importing from lib (leaf→leaf)
			code: `import { format } from "#app/features/notes/lib/format"`,
			filename: "/project/src/app/features/notes/hooks/useNotes.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// part importing from lib (leaf→leaf)
			code: `import { format } from "#app/features/notes/lib/format"`,
			filename: "/project/src/app/features/notes/parts/NoteItem.tsx",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// lib importing from hooks (leaf→leaf)
			code: `import { useNotes } from "#app/features/notes/hooks/useNotes"`,
			filename: "/project/src/app/features/notes/lib/utils.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// part importing from hooks (leaf→leaf)
			code: `import { useNotes } from "#app/features/notes/hooks/useNotes"`,
			filename: "/project/src/app/features/notes/parts/NoteItem.tsx",
			errors: [{ messageId: "forbidden" }],
		},
	],
})
