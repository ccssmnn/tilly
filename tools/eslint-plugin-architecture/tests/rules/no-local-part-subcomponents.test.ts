import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-local-part-subcomponents.js"

ruleTester.run("no-local-part-subcomponents", rule, {
	valid: [
		{
			// single component with helpers
			code: `
				function formatDate(d: Date) { return d.toISOString() }
				export function NoteContent() {
					return <div>{formatDate(new Date())}</div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// single component — no violation even with PascalCase non-function const
			code: `
				const MAX_LENGTH = 100
				export function NoteContent() {
					return <div />
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// multiple PascalCase functions that don't render each other
			code: `
				export function NoteContentHeader() {
					return <div>header</div>
				}
				export function NoteContentBody() {
					return <div>body</div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// non-part file — rule doesn't apply
			code: `
				function Inner() { return <div /> }
				export function NotesScreen() {
					return <Inner />
				}
			`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
	],
	invalid: [
		{
			// function declaration renders local component
			code: `
				function Inner() { return <div>inner</div> }
				export function NoteContent() {
					return <div><Inner /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noSubcomponent", data: { name: "Inner" } }],
		},
		{
			// arrow function renders local component
			code: `
				const Inner = () => <div>inner</div>
				export function NoteContent() {
					return <div><Inner /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noSubcomponent", data: { name: "Inner" } }],
		},
		{
			// exported subcomponent rendered by another export
			code: `
				export function NoteContentActions() { return <div>actions</div> }
				export function NoteContent() {
					return <div><NoteContentActions /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [
				{ messageId: "noSubcomponent", data: { name: "NoteContentActions" } },
			],
		},
		{
			// default export rendering a local component
			code: `
				function Header() { return <div>header</div> }
				export default function NoteContent() {
					return <div><Header /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noSubcomponent", data: { name: "Header" } }],
		},
		{
			// call expression (createContext, memo, forwardRef) rendered as JSX
			code: `
				let NoteContext = createContext(null)
				export function NoteContent() {
					return <NoteContext value={null}><div /></NoteContext>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noSubcomponent", data: { name: "NoteContext" } }],
		},
	],
})
