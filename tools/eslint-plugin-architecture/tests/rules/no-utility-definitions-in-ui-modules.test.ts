import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-utility-definitions-in-ui-modules.js"

ruleTester.run("no-utility-definitions-in-ui-modules", rule, {
	valid: [
		{
			// component in widget — allowed
			code: `
				export function NotificationSection() {
					return <div>notifications</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// PascalCase component in part — allowed
			code: `
				export function NoteContent() {
					return <div />
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
		},
		{
			// function in lib — allowed
			code: `
				export function getDeviceName() { return "device" }
			`,
			filename: "/project/src/app/features/settings/lib/device-name.ts",
		},
		{
			// hook in hooks — allowed
			code: `
				export function useCurrentEndpoint() { return null }
			`,
			filename:
				"/project/src/app/features/settings/hooks/use-current-endpoint.ts",
		},
		{
			// non-UI module — allowed
			code: `
				function getDeviceName() { return "device" }
				export { getDeviceName }
			`,
			filename: "/project/src/app/features/settings/lib/device-name.ts",
		},
		{
			// type declarations — allowed
			code: `
				type Props = { name: string }
				interface Config { key: string }
				export function NotificationSection() {
					return <div />
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// const non-function — allowed (not a utility function)
			code: `
				const MAX_DEVICES = 10
				export function NotificationSection() {
					return <div>{MAX_DEVICES}</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// server operation — functions allowed (operations ARE the logic)
			code: `
				export async function sendPush(payload: unknown) { return payload }
			`,
			filename: "/project/src/server/features/push/operations/send-push.ts",
		},
		{
			// server part — functions allowed (parts ARE the logic)
			code: `
				export function formatPayload(data: unknown) { return JSON.stringify(data) }
			`,
			filename: "/project/src/server/features/push/parts/format-payload.ts",
		},
	],
	invalid: [
		{
			// utility function in widget
			code: `
				function getDeviceName() { return "device" }
				export function NotificationSection() {
					return <div>{getDeviceName()}</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noUtility", data: { name: "getDeviceName" } }],
		},
		{
			// hook in widget
			code: `
				function useCurrentEndpoint() { return null }
				export function NotificationSection() {
					return <div />
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noHook", data: { name: "useCurrentEndpoint" } }],
		},
		{
			// utility function in part
			code: `
				function formatDate(d: Date) { return d.toISOString() }
				export function NoteContent() {
					return <div>{formatDate(new Date())}</div>
				}
			`,
			filename: "/project/src/app/features/notes/parts/NoteContent.tsx",
			errors: [{ messageId: "noUtility", data: { name: "formatDate" } }],
		},
		{
			// utility function in screen
			code: `
				function buildQuery(filters: string[]) { return filters.join(",") }
				export function NotesScreen() {
					return <div>{buildQuery(["a"])}</div>
				}
			`,
			filename: "/project/src/app/features/notes/screens/NotesScreen.tsx",
			errors: [{ messageId: "noUtility", data: { name: "buildQuery" } }],
		},
		{
			// exported utility function
			code: `
				export function getDeviceName() { return "device" }
				export function NotificationSection() {
					return <div />
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noUtility", data: { name: "getDeviceName" } }],
		},
		{
			// arrow function utility
			code: `
				const getDeviceName = () => "device"
				export function NotificationSection() {
					return <div>{getDeviceName()}</div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noUtility", data: { name: "getDeviceName" } }],
		},
		{
			// async utility function
			code: `
				async function subscribeToPush() { await fetch("/api") }
				export function NotificationSection() {
					return <div />
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noUtility", data: { name: "subscribeToPush" } }],
		},
		{
			// utility function in handler (server handler = wiring only)
			code: `
				function formatPayload(data: unknown) { return JSON.stringify(data) }
				export function PushHandler() { return formatPayload({}) }
			`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
			errors: [{ messageId: "noUtility", data: { name: "formatPayload" } }],
		},
	],
})
