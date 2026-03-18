import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-local-widget-subcomponents.js"

ruleTester.run("no-local-widget-subcomponents", rule, {
	valid: [
		{
			// single component — no violation
			code: `
				export function NotificationSection() {
					return <div>notifications</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// single component with helpers
			code: `
				function formatDate(d: Date) { return d.toISOString() }
				export function NotificationSection() {
					return <div>{formatDate(new Date())}</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// multiple PascalCase functions that don't render each other
			code: `
				export function NotificationHeader() {
					return <div>header</div>
				}
				export function NotificationBody() {
					return <div>body</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// non-widget file — rule doesn't apply
			code: `
				function Inner() { return <div /> }
				export function NotesScreen() {
					return <Inner />
				}
			`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
		},
		{
			// part file — rule doesn't apply (separate rule covers parts)
			code: `
				function Inner() { return <div /> }
				export function NoteContent() {
					return <Inner />
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
	],
	invalid: [
		{
			// function declaration renders local component
			code: `
				function TimezoneSection() { return <div>tz</div> }
				export function NotificationSection() {
					return <div><TimezoneSection /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [
				{ messageId: "noSubcomponent", data: { name: "TimezoneSection" } },
			],
		},
		{
			// arrow function renders local component
			code: `
				const DeviceItem = () => <div>device</div>
				export function NotificationSection() {
					return <div><DeviceItem /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noSubcomponent", data: { name: "DeviceItem" } }],
		},
		{
			// multiple sub-components rendered
			code: `
				function TimezoneSection() { return <div>tz</div> }
				function DeviceList() { return <div>devices</div> }
				export function NotificationSection() {
					return <div><TimezoneSection /><DeviceList /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [
				{ messageId: "noSubcomponent", data: { name: "TimezoneSection" } },
				{ messageId: "noSubcomponent", data: { name: "DeviceList" } },
			],
		},
	],
})
