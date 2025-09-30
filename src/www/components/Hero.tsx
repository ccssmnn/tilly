import { Button } from "#shared/ui/button"
import { Badge } from "#shared/ui/badge"
import { TypographyH1, TypographyLead } from "#shared/ui/typography"
import { PhoneMedia, type PhoneMediaSource } from "./PhoneMedia"

export { Hero }

interface HeroProps {
	badge?: {
		text: string
		href: string
		description: string
	}
	title: string
	description: string
	primaryCta: {
		text: string
		href: string
	}
	secondaryCta: {
		text: string
		href: string
	}
	media: PhoneMediaSource
}

function Hero({
	badge,
	title,
	description,
	primaryCta,
	secondaryCta,
	media,
}: HeroProps) {
	return (
		<div className="bg-background container mx-auto grid items-center justify-items-center gap-12 px-3 md:grid-cols-2">
			<div className="flex flex-col gap-6">
				{badge && (
					<div className="inline-flex gap-3">
						<Badge variant="outline">{badge.text}</Badge>
						<Button asChild variant="ghost" size="sm">
							<a href={badge.href}>
								{badge.description} <span aria-hidden="true">→</span>
							</a>
						</Button>
					</div>
				)}
				<TypographyH1>{title}</TypographyH1>
				<TypographyLead>{description}</TypographyLead>
				<div className="inline-flex gap-3">
					<Button asChild>
						<a
							href={primaryCta.href}
							className="plausible--event-name=Hero+Primary+CTA"
						>
							{primaryCta.text}
						</a>
					</Button>
					<Button asChild variant="ghost">
						<a href={secondaryCta.href}>
							{secondaryCta.text} <span aria-hidden="true">→</span>
						</a>
					</Button>
				</div>
			</div>
			<PhoneMedia
				media={media}
				className="max-w-[18rem] sm:max-w-[20rem] md:max-w-[22rem]"
			/>
		</div>
	)
}
