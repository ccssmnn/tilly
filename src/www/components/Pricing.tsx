import { TypographyH2, TypographyP } from "#shared/ui/typography"
import { Card, CardContent, CardFooter } from "#shared/ui/card"
import { buttonVariants } from "#shared/ui/button"
import { Check as CheckIcon } from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"

export { Pricing }

interface PricingTier {
	name: string
	id: string
	href: string
	priceMonthly: string
	priceSuffix?: string | null
	description: string
	features: string[]
	featured: boolean
	ctaText?: string
}

interface Props {
	title: string
	subtitle: string
	ctaText?: string
	tiers: PricingTier[]
}

function Pricing({ title, subtitle, ctaText, tiers }: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto max-w-4xl text-center">
				<TypographyH2>{title}</TypographyH2>
				<TypographyP>{subtitle}</TypographyP>
			</div>
			<div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 lg:mt-20 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-8 lg:gap-y-0">
				{tiers.map(tier => (
					<Card
						key={tier.id}
						className={cn(
							"bg-card/60 md:mx-0",
							tier.featured &&
								"bg-card border-primary ring-primary/20 relative scale-105 transform shadow-2xl ring-1",
						)}
					>
						<CardContent className="p-8 md:p-10">
							<h3 id={tier.id} className="text-primary font-semibold">
								{tier.name}
							</h3>
							<p className="mt-4 flex items-baseline gap-x-2">
								<span
									className={`text-5xl font-semibold tracking-tight ${
										tier.featured ? "text-foreground" : "text-foreground"
									}`}
								>
									{tier.priceMonthly}
								</span>
								{tier.priceSuffix ? (
									<span className="text-muted-foreground text-base">
										{tier.priceSuffix}
									</span>
								) : null}
							</p>
							<TypographyP
								className={`mt-6 text-base/7 ${
									tier.featured
										? "text-muted-foreground"
										: "text-muted-foreground"
								}`}
							>
								{tier.description}
							</TypographyP>
							<ul
								role="list"
								className="text-muted-foreground mt-8 space-y-3 text-sm/6 md:mt-10"
							>
								{tier.features.map(feature => (
									<li key={feature} className="flex gap-x-3">
										<CheckIcon
											aria-hidden="true"
											className={`h-6 w-5 flex-none ${
												tier.featured ? "text-primary" : "text-primary"
											}`}
										/>
										{feature}
									</li>
								))}
							</ul>
							<CardFooter className="mt-8 justify-end">
								<a
									href={tier.href}
									aria-describedby={tier.id}
									className={cn(
										buttonVariants({
											variant: tier.featured ? "default" : "secondary",
										}),
									)}
								>
									{tier.ctaText || ctaText || "Get started"}
								</a>
							</CardFooter>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
