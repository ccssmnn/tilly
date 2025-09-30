import { Badge } from "#shared/ui/badge"
import {
	TypographyH2,
	TypographyLead,
	TypographyP,
} from "#shared/ui/typography"
import { PhoneMedia, type PhoneMediaSource } from "./PhoneMedia"

export { FeaturesWithProductScreenshot }

interface Props {
	badge?: string
	title: string
	subtitle?: string
	features: Array<{
		name: string
		description: string
	}>
	closing?: string
	media: PhoneMediaSource
}

function FeaturesWithProductScreenshot({
	badge,
	title,
	subtitle,
	features,
	closing,
	media,
}: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 md:mx-0 md:mt-10 md:max-w-none md:grid-cols-2 md:items-center">
				<div className="md:pr-8">
					<div className="md:max-w-lg">
						{badge && (
							<Badge variant="outline" className="mb-4">
								{badge}
							</Badge>
						)}
						<TypographyH2>{title}</TypographyH2>
						{subtitle && (
							<TypographyLead className="mt-6">{subtitle}</TypographyLead>
						)}
						<ul className="mt-10 max-w-xl list-none space-y-8">
							{features.map(feature => (
								<li key={feature.name}>
									<span className="mr-1 font-semibold">{feature.name}</span>
									<span className="text-muted-foreground">
										{feature.description}
									</span>
								</li>
							))}
						</ul>
						{closing && <TypographyP>{closing}</TypographyP>}
					</div>
				</div>
				<div className="flex items-center justify-center">
					<PhoneMedia
						media={media}
						className="max-w-[18rem] sm:max-w-[20rem]"
					/>
				</div>
			</div>
		</div>
	)
}
