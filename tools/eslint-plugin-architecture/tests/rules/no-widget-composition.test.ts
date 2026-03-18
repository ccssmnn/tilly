import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/no-widget-composition.js"

ruleTester.run("no-widget-composition", rule, {
	valid: [
		{
			// widget using DOM elements
			code: `
				export function NotificationSection() {
					return <div><span>hello</span></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// widget using shared UI
			code: `
				import { Button } from "#shared/ui/button"
				export function NotificationSection() {
					return <Button>click</Button>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// widget using a part
			code: `
				import { SettingsRow } from "#app/features/settings/parts/SettingsRow"
				export function NotificationSection() {
					return <SettingsRow />
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// non-widget file can compose widgets freely
			code: `
				import { NotificationSection } from "#app/features/settings/widgets/notification-section"
				import { AccountSection } from "#app/features/settings/widgets/account-section"
				export function SettingsScreen() {
					return <div><NotificationSection /><AccountSection /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/screens/settings-screen.tsx",
		},
		{
			// type-only import from widgets is fine
			code: `
				import type { NotificationProps } from "#app/features/settings/widgets/notification-section"
				export function AccountSection() {
					return <div />
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/account-section.tsx",
		},
		{
			// same-feature widget composition via absolute import is allowed
			code: `
				import { AccountSection } from "#app/features/settings/widgets/account-section"
				export function NotificationSection() {
					return <div><AccountSection /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
		{
			// same-feature widget composition via relative import is allowed
			code: `
				import { AccountSection } from "./account-section"
				export function NotificationSection() {
					return <div><AccountSection /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
		},
	],
	invalid: [
		{
			// widget importing and rendering a widget from different feature
			code: `
				import { PersonWidget } from "#app/features/people/widgets/person-widget"
				export function NotificationSection() {
					return <div><PersonWidget /></div>
				}
			`,
			filename:
				"/project/src/app/features/settings/widgets/notification-section.tsx",
			errors: [{ messageId: "noWidgetComposition" }],
		},
	],
})
