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
			// handler imports part — same feature
			code: `import { sendNotification } from "#server/features/push/parts/send-notification"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
		{
			// operation imports part — same feature
			code: `import { formatPayload } from "#server/features/push/parts/format-payload"`,
			filename: "/project/src/server/features/push/operations/send-push.ts",
		},
		{
			// relative import from screen to part
			code: `import { NoteItem } from "../parts/NoteItem"`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// non-part import is fine from anywhere
			code: `import { useNotes } from "#app/features/notes/hooks/useNotes"`,
			filename: "/project/src/app/features/notes/hooks/useOtherHook.ts",
		},
		{
			// type-only import exempt
			code: `import type { NoteItemProps } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/hooks/useNotes.ts",
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
			// feature index must not re-export parts
			code: `import { NoteItem } from "#app/features/notes/parts/NoteItem"`,
			filename: "/project/src/app/features/notes/index.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// server lib importing a part
			code: `import { sendNotification } from "#server/features/push/parts/send-notification"`,
			filename: "/project/src/server/features/push/lib/utils.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// cross-feature operation importing a part
			code: `import { formatPayload } from "#server/features/push/parts/format-payload"`,
			filename: "/project/src/server/features/chat/operations/send-chat.ts",
			errors: [{ messageId: "forbidden" }],
		},
	],
})
