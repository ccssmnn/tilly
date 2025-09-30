import type { ReactNode } from "react"

export { SettingsSection }
export type { SettingsSectionProps }

interface SettingsSectionProps {
	title: string
	description: string
	children: ReactNode
}

function SettingsSection({
	title,
	description,
	children,
}: SettingsSectionProps) {
	return (
		<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-3 py-8 md:grid-cols-3">
			<div>
				<h2 className="text-xl/7 font-semibold">{title}</h2>
				<p className="text-muted-foreground mt-1 text-sm/6">{description}</p>
			</div>
			<div className="md:col-span-2">{children}</div>
		</div>
	)
}
