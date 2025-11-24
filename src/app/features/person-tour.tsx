import { Button } from "#shared/ui/button"
import { NewPerson } from "#app/features/new-person"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { PeopleFill } from "react-bootstrap-icons"
import { T } from "#shared/intl"

export { PersonTour }

function PersonTour({ onSuccess }: { onSuccess?: (personId: string) => void }) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<PeopleFill />
				</EmptyMedia>
				<EmptyTitle>
					<T k="addPerson.title" />
				</EmptyTitle>
				<EmptyDescription>
					<T k="addPerson.description" />
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<NewPerson onSuccess={onSuccess}>
					<Button>
						<PeopleFill />
						<T k="addPerson.button" />
					</Button>
				</NewPerson>
			</EmptyContent>
		</Empty>
	)
}
