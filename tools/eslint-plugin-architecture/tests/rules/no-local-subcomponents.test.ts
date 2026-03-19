import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-local-subcomponents.js"

ruleTester.run("no-local-subcomponents", rule, {
	valid: [
		// --- Parts ---
		{
			code: `
				export function NoteContent() {
					return <div>content</div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
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
		// --- Widgets ---
		{
			code: `
				export function NotificationSection() {
					return <div>notifications</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			code: `
				function formatDate(d: Date) { return d.toISOString() }
				export function NotificationSection() {
					return <div>{formatDate(new Date())}</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		// --- Screens ---
		{
			code: `
				export function PeopleScreen() {
					return <div>people</div>
				}
			`,
			filename:
				"/project/src/app/features/people/screens/people-screen.tsx",
		},
		{
			code: `
				function formatDate(d: Date) { return d.toISOString() }
				export function InviteScreen() {
					return <div>{formatDate(new Date())}</div>
				}
			`,
			filename:
				"/project/src/app/features/people/screens/invite-screen.tsx",
		},
		// --- Non-structural files — rule doesn't apply ---
		{
			code: `
				function Inner() { return <div /> }
				export function useCustomHook() {
					return <Inner />
				}
			`,
			filename: "/project/src/app/features/notes/hooks/useCustomHook.tsx",
		},
		{
			code: `
				function Inner() { return <div /> }
				export function AppLayout() {
					return <Inner />
				}
			`,
			filename: "/project/src/app/components/AppLayout.tsx",
		},
	],
	invalid: [
		// --- Parts ---
		{
			code: `
				function Inner() { return <div>inner</div> }
				export function NoteContent() {
					return <div><Inner /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noSubcomponent" }],
		},
		{
			code: `
				const Inner = () => <div>inner</div>
				export function NoteContent() {
					return <div><Inner /></div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noSubcomponent" }],
		},
		// --- Widgets ---
		{
			code: `
				function TimezoneSection() { return <div>tz</div> }
				export function NotificationSection() {
					return <div><TimezoneSection /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noSubcomponent" }],
		},
		{
			code: `
				function DeviceList() { return <div>devices</div> }
				function TimezoneSection() { return <div>tz</div> }
				export function NotificationSection() {
					return <div><TimezoneSection /><DeviceList /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [
				{ messageId: "noSubcomponent" },
				{ messageId: "noSubcomponent" },
			],
		},
		// --- Screens ---
		{
			code: `
				function AuthenticatedView() { return <div>auth</div> }
				export function InviteScreen() {
					return <div><AuthenticatedView /></div>
				}
			`,
			filename:
				"/project/src/app/features/people/screens/invite-screen.tsx",
			errors: [{ messageId: "noSubcomponent" }],
		},
		{
			code: `
				const TabContent = () => <div>tab</div>
				export function PersonScreen() {
					return <div><TabContent /></div>
				}
			`,
			filename:
				"/project/src/app/features/people/screens/person-screen.tsx",
			errors: [{ messageId: "noSubcomponent" }],
		},
	],
})
