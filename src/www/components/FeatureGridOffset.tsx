import { TypographyH2, TypographyLead } from "#shared/ui/typography"

export { FeatureGridOffset }

interface Props {
	title: string
	subtitle: string
	problems: Array<{
		name: string
		description: string
	}>
}

function FeatureGridOffset({ title, subtitle, problems }: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 md:mx-0 md:max-w-none md:grid-cols-5 md:gap-16">
				<div className="space-y-6 md:col-span-2">
					<TypographyH2>{title}</TypographyH2>
					<TypographyLead>{subtitle}</TypographyLead>
				</div>
				<dl className="grid grid-cols-1 gap-x-8 gap-y-8 md:col-span-3 md:grid-cols-2 md:gap-y-16">
					{problems.map(problem => (
						<div key={problem.name} className="space-y-3">
							<dt className="text-foreground text-lg font-semibold">
								{problem.name}
							</dt>
							<dd className="text-muted-foreground">{problem.description}</dd>
						</div>
					))}
				</dl>
			</div>
		</div>
	)
}
