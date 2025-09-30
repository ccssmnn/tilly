import { Badge } from "#shared/ui/badge"
import { TypographyH2, TypographyLead } from "#shared/ui/typography"
import type { ReactNode } from "react"

export { ContentWithTestimonial }

interface Props {
	badge?: string
	title: string
	subtitle?: string
	testimonial: {
		quote: string
		author: {
			name: string
			title: string
			avatar?: string
		}
	}
	children?: ReactNode
}

function ContentWithTestimonial({
	badge,
	title,
	subtitle,
	testimonial,
	children,
}: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto max-w-2xl md:mx-0">
				{badge && <Badge variant="outline">{badge}</Badge>}
				<TypographyH2>{title}</TypographyH2>
				{subtitle && (
					<TypographyLead className="mt-4">{subtitle}</TypographyLead>
				)}
			</div>
			<div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 md:mx-0 md:mt-10 md:max-w-none md:grid-cols-12">
				<div className="prose prose-gray dark:prose-invert max-w-xl md:col-span-7">
					{children}
				</div>
				<div className="relative md:order-last md:col-span-5">
					<figure className="border-primary border-l pl-8">
						<blockquote className="text-foreground text-xl/8 font-semibold tracking-tight">
							<p>"{testimonial.quote}"</p>
						</blockquote>
						<figcaption className="mt-8 flex gap-x-4">
							{testimonial.author.avatar && (
								<img
									alt=""
									src={testimonial.author.avatar}
									className="bg-muted mt-1 size-10 flex-none rounded-full"
								/>
							)}
							<div className="text-sm/6">
								<div className="text-foreground font-semibold">
									{testimonial.author.name}
								</div>
								<div className="text-muted-foreground">
									{testimonial.author.title}
								</div>
							</div>
						</figcaption>
					</figure>
				</div>
			</div>
		</div>
	)
}
