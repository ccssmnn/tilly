import { TypographyH2, TypographyP } from "#shared/ui/typography"
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "#shared/ui/accordion"

export { FAQ }

interface Props {
	title: string
	description?: string
	faqs: {
		question: string
		answer: string
	}[]
}

function FAQ({ title, description, faqs }: Props) {
	return (
		<div className="container mx-auto px-6 md:px-8">
			<div className="mx-auto max-w-4xl text-center">
				<TypographyH2>{title}</TypographyH2>
				{description && <TypographyP>{description}</TypographyP>}
			</div>
			<div className="mx-auto mt-10 max-w-2xl md:mt-16">
				<Accordion type="single" collapsible className="w-full">
					{faqs.map((faq, index) => (
						<AccordionItem key={index} value={`item-${index}`}>
							<AccordionTrigger className="text-left">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent>
								<TypographyP className="text-muted-foreground mt-0 leading-snug">
									{faq.answer}
								</TypographyP>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	)
}
