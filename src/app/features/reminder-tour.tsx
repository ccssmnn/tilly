import { Button } from "#shared/ui/button"
import { NewReminder } from "#app/features/new-reminder"
import { NewPerson } from "#app/features/new-person"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { BellFill, PersonPlusFill } from "react-bootstrap-icons"
import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { T } from "#shared/intl"

export { ReminderTour }

function ReminderTour({
	onSuccess,
	personId,
}: {
	onSuccess?: () => void
	personId?: string
}) {
	let people = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(p => !isDeleted(p))
		},
	})

	let targetPerson = personId
		? people.find(p => p.$jazz.id === personId)
		: people.at(0)

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<BellFill />
				</EmptyMedia>
				<EmptyTitle>
					<T k="addReminder.title" />
				</EmptyTitle>
				<EmptyDescription>
					<T k="addReminder.description" />
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				{targetPerson !== undefined ? (
					<NewReminder onSuccess={onSuccess} personId={targetPerson.$jazz.id}>
						<Button>
							<BellFill />
							<T k="addReminder.button" params={{ name: targetPerson.name }} />
						</Button>
					</NewReminder>
				) : (
					<NewPerson>
						<Button>
							<PersonPlusFill />
							<T k="addPerson.button" />
						</Button>
					</NewPerson>
				)}
			</EmptyContent>
		</Empty>
	)
}
