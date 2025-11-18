import { Button } from "#shared/ui/button"
import { NewReminder } from "#app/features/new-reminder"
import { NewPerson } from "#app/features/new-person"
import { TypographyH2, TypographyLead } from "#shared/ui/typography"
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
		<div className="max-w-md space-y-3 text-left">
			<BellFill className="text-muted-foreground size-16" />
			<TypographyH2>
				<T k="addReminder.title" />
			</TypographyH2>
			<TypographyLead>
				<T k="addReminder.description" />
			</TypographyLead>
			{targetPerson !== undefined ? (
				<div className="mt-8 flex justify-end">
					<NewReminder onSuccess={onSuccess} personId={targetPerson.$jazz.id}>
						<Button>
							<BellFill />
							<T k="addReminder.button" params={{ name: targetPerson.name }} />
						</Button>
					</NewReminder>
				</div>
			) : (
				<div className="mt-8 flex justify-end">
					<NewPerson>
						<Button>
							<PersonPlusFill />
							<T k="addPerson.button" />
						</Button>
					</NewPerson>
				</div>
			)}
		</div>
	)
}
