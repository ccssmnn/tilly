import { TypographyH2, TypographyLead } from "#shared/ui/typography"

export { Testimonials }

interface Props {
	title: string
	subtitle?: string
	testimonials: { quote: string; author?: string }[]
}

function Testimonials({ title, subtitle, testimonials }: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<TypographyH2>{title}</TypographyH2>
				{subtitle && (
					<TypographyLead className="mt-6">{subtitle}</TypographyLead>
				)}
			</div>
			<div className="mx-auto mt-16 max-w-5xl">
				<div className="grid gap-12 md:grid-cols-2 md:gap-16">
					{testimonials.map((testimonial, index) => (
						<figure key={index} className="border-primary border-l pl-8">
							<blockquote className="text-foreground text-lg font-medium tracking-tight">
								<p>"{testimonial.quote}"</p>
							</blockquote>
							{testimonial.author && (
								<figcaption className="text-muted-foreground mt-6 text-sm">
									— {testimonial.author}
								</figcaption>
							)}
						</figure>
					))}
				</div>
			</div>
		</div>
	)
}
