import { Button } from "#shared/ui/button"
import { NewNote } from "#app/features/new-note"
import { NewPerson } from "#app/features/new-person"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { FileEarmarkText, PersonPlusFill } from "react-bootstrap-icons"
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
					<FileEarmarkText />
				</EmptyMedia>
				<EmptyTitle>
					<T k="addNote.title" />
				</EmptyTitle>
				<EmptyDescription>
					<T k="addNote.description" />
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				{targetPerson !== undefined ? (
					<NewNote onSuccess={onSuccess} personId={targetPerson.$jazz.id}>
						<Button>
							<FileEarmarkText />
							<T k="addNote.button" params={{ name: targetPerson.name }} />
						</Button>
					</NewNote>
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
