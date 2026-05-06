import { Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { FileEarmarkText, Trash } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { Button } from "#shared/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { ActiveNote, DeletedNote, NewNote } from "#app/features/notes"

export { PersonNotesList }

type PersonNotesListProps = {
	notes: co.loaded<typeof Note>[]
	person: co.loaded<typeof Person>
	searchQuery: string
	statusFilter: "active" | "deleted"
}

function PersonNotesList({
	notes,
	person,
	searchQuery,
	statusFilter,
}: PersonNotesListProps) {
	if (notes.length === 0) {
		if (!searchQuery) {
			if (statusFilter === "deleted") {
				return (
					<div className="flex flex-col items-center justify-center py-12">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon" className="bg-destructive/10">
									<Trash className="text-destructive" />
								</EmptyMedia>
								<EmptyTitle>
									<T k="notes.empty.noDeleted" />
								</EmptyTitle>
								<EmptyDescription>
									<T k="notes.empty.noDeleted.description" />
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
				)
			}
			return (
				<div className="flex flex-col items-center justify-center py-12">
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
							<NewNote
								personId={person.$jazz.id}
								render={
									<Button>
										<FileEarmarkText />
										<T k="addNote.button" params={{ name: person.name }} />
									</Button>
								}
							/>
						</EmptyContent>
					</Empty>
				</div>
			)
		}

		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileEarmarkText />
						</EmptyMedia>
						<EmptyTitle>
							<T k="notes.empty.withSearch" params={{ query: searchQuery }} />
						</EmptyTitle>
						<EmptyDescription>
							<T k="notes.empty.suggestion.withSearch" />
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<div>
			{notes.map(note =>
				note.deletedAt ? (
					<DeletedNote
						key={note.$jazz.id}
						note={note}
						person={person}
						searchQuery={searchQuery}
						hidePerson
					/>
				) : (
					<ActiveNote
						key={note.$jazz.id}
						note={note}
						person={person}
						searchQuery={searchQuery}
						hidePerson
					/>
				),
			)}
		</div>
	)
}
