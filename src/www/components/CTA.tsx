import { TypographyH2 } from "#shared/ui/typography"
import { buttonVariants } from "#shared/ui/button"
import { cn } from "#app/lib/utils"

export { CTA }

interface Props {
	title: string
	primaryCta: {
		text: string
		href: string
	}
	secondaryCta?: {
		text: string
		href: string
	}
}

function CTA({ title, primaryCta, secondaryCta }: Props) {
	return (
		<div className="bg-background">
			<div className="container mx-auto px-6 py-24 md:flex md:items-center md:justify-around">
				<TypographyH2>{title}</TypographyH2>
				<div className="mt-10 flex items-center gap-x-6 md:mt-0 md:shrink-0">
					<a
						href={primaryCta.href}
						className={cn(
							buttonVariants({ variant: "default" }),
							"px-3.5 py-2.5",
						)}
					>
						{primaryCta.text}
					</a>
					{secondaryCta && (
						<a
							href={secondaryCta.href}
							className="text-foreground text-sm/6 font-semibold hover:opacity-80"
						>
							{secondaryCta.text}
							<span aria-hidden="true">→</span>
						</a>
					)}
				</div>
			</div>
		</div>
	)
}
