import { Button } from "#shared/ui/button"
import { NewNote } from "#app/features/new-note"
import { NewPerson } from "#app/features/new-person"
import { TypographyH2, TypographyLead } from "#shared/ui/typography"
import { Journal, PersonPlusFill } from "react-bootstrap-icons"
import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { T } from "#shared/intl"

export { NoteTour }

function NoteTour({
	onSuccess,
	personId,
}: {
	onSuccess?: () => void
	personId?: string
}) {
	let { me } = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
	})

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let targetPerson = personId
		? people.find(p => p.$jazz.id === personId)
		: people.at(0)

	return (
		<div className="max-w-md space-y-3 text-left">
			<Journal className="text-muted-foreground size-16" />
			<TypographyH2>
				<T k="addNote.title" />
			</TypographyH2>
			<TypographyLead>
				<T k="addNote.description" />
			</TypographyLead>
			{targetPerson !== undefined ? (
				<div className="mt-8 flex justify-end">
					<NewNote onSuccess={onSuccess} personId={targetPerson.$jazz.id}>
						<Button>
							<Journal />
							<T k="addNote.button" params={{ name: targetPerson.name }} />
						</Button>
					</NewNote>
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
