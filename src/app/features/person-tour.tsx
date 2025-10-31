import { Button } from "#shared/ui/button"
import { NewPerson } from "#app/features/new-person"
import { TypographyH2, TypographyLead } from "#shared/ui/typography"
import { PeopleFill } from "react-bootstrap-icons"
import { T } from "#shared/intl"

export { PersonTour }

function PersonTour({ onSuccess }: { onSuccess?: (personId: string) => void }) {
	return (
		<div className="max-w-md space-y-3 text-left">
			<PeopleFill className="text-muted-foreground size-16" />
			<TypographyH2>
				<T k="addPerson.title" />
			</TypographyH2>
			<TypographyLead>
				<T k="addPerson.description" />
			</TypographyLead>
			<div className="mt-8 flex justify-end">
				<NewPerson onSuccess={onSuccess}>
					<Button>
						<PeopleFill />
						<T k="addPerson.button" />
					</Button>
				</NewPerson>
			</div>
		</div>
	)
}
