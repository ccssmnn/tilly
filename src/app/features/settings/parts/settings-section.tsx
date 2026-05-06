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
		<div className="grid grid-cols-1 gap-x-8 gap-y-6 py-8 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-y-4 md:py-8">
			<div className="space-y-1.5">
				<h2 className="text-xl/8 font-semibold sm:text-lg/7">{title}</h2>
				<p className="text-muted-foreground text-sm/6">{description}</p>
			</div>
			<div className="min-w-0">{children}</div>
		</div>
	)
}
