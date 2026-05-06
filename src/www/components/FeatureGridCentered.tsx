import { Badge } from "#shared/ui/badge"
import { TypographyH2, TypographyLead } from "#shared/ui/typography"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	UserIcon,
	Notification01Icon,
	SmartPhone01Icon,
	ChatIcon,
	CloudIcon,
	LockIcon,
} from "@hugeicons/core-free-icons"

export { FeatureGridCentered }

interface Props {
	badge?: string
	title: string
	description?: string
	features: {
		name: string
		description: string
		icon: string
	}[]
}

let iconMap = {
	PersonHearts: { icon: UserIcon },
	Bell: { icon: Notification01Icon },
	PhoneFill: { icon: SmartPhone01Icon },
	Chat: { icon: ChatIcon },
	Download: { icon: LockIcon },
	CloudCheck: { icon: CloudIcon },
}

function FeatureGridCentered({ badge, title, description, features }: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto max-w-2xl text-center">
				{badge && (
					<Badge variant="outline" className="mb-4">
						{badge}
					</Badge>
				)}
				<TypographyH2>{title}</TypographyH2>
				{description && (
					<TypographyLead className="mt-6">{description}</TypographyLead>
				)}
			</div>

			<div className="mx-auto mt-16 max-w-2xl md:mt-20 md:max-w-5xl">
				<dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-12 md:max-w-none md:grid-cols-3 md:gap-y-16">
					{features.map(feature => {
						let iconData = iconMap[feature.icon as keyof typeof iconMap]
						return (
							<div key={feature.name}>
								<dt className="text-foreground text-base font-semibold">
									<div className="bg-primary mb-4 flex size-12 items-center justify-center rounded-xl">
										<HugeiconsIcon
											icon={iconData.icon}
											className="text-primary-foreground size-7"
										/>
									</div>
									{feature.name}
								</dt>
								<dd className="text-muted-foreground mt-3 text-sm leading-relaxed">
									{feature.description}
								</dd>
							</div>
						)
					})}
				</dl>
			</div>
		</div>
	)
}
