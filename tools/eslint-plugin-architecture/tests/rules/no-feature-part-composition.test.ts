import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-feature-part-composition.js"

ruleTester.run("no-feature-part-composition", rule, {
	valid: [
		{
			// part using DOM elements
			code: `
				export function NoteContent() {
					return <div><span>hello</span></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// part using shared UI
			code: `
				import { Button } from "#shared/ui/button"
				export function NoteContent() {
					return <Button>click</Button>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// part using app component
			code: `
				import { Navigation } from "#app/components/navigation"
				export function NoteContent() {
					return <Navigation />
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// non-part file can compose parts freely
			code: `
				import { NoteItem } from "#app/features/notes/parts/NoteItem"
				import { NoteHeader } from "#app/features/notes/parts/NoteHeader"
				export function NotesScreen() {
					return <div><NoteHeader /><NoteItem /></div>
				}
			`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// type-only import from parts is fine
			code: `
				import type { NoteItemProps } from "#app/features/notes/parts/NoteItem"
				export function NoteContent() {
					return <div />
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// server part importing non-part (lib)
			code: `import { db } from "#server/lib/db"`,
			filename: "/project/src/server/features/push/parts/send-notification.ts",
		},
		{
			// server part type-only import from another part
			code: `import type { TokenPayload } from "./validate-token"`,
			filename: "/project/src/server/features/push/parts/create-token.ts",
		},
	],
	invalid: [
		{
			// part importing and rendering another part from same feature
			code: `
				import { PersonAvatar } from "#app/features/notes/parts/PersonAvatar"
				export function NoteContent() {
					return <div><PersonAvatar /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noPartComposition" }],
		},
		{
			// part importing and rendering a part from different feature
			code: `
				import { PersonAvatar } from "#app/features/people/parts/PersonAvatar"
				export function NoteContent() {
					return <div><PersonAvatar /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noPartComposition" }],
		},
		{
			// relative import to sibling part
			code: `
				import { PersonAvatar } from "./PersonAvatar"
				export function NoteContent() {
					return <div><PersonAvatar /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noPartComposition" }],
		},
		{
			// server part importing another server part
			code: `import { validateToken } from "./validate-token"`,
			filename: "/project/src/server/features/push/parts/create-token.ts",
			errors: [{ messageId: "noPartComposition" }],
		},
		{
			// server part importing part via alias
			code: `import { validateToken } from "#server/features/push/parts/validate-token"`,
			filename: "/project/src/server/features/push/parts/create-token.ts",
			errors: [{ messageId: "noPartComposition" }],
		},
	],
})
