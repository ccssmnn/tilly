import { Note } from "#shared/schema/user"
import { co } from "jazz-tools"
import { T } from "#shared/intl/setup"
import { DialogHeader, DialogTitle, DialogDescription } from "#shared/ui/dialog"
import { NoteForm } from "#app/features/notes/parts/note-form"

export { EditNoteForm }

type EditNoteFormProps = {
	note: co.loaded<typeof Note>
	onSubmit: (values: {
		content: string
		pinned: boolean
		images?: File[]
		removedImageIds?: string[]
	}) => void
	onCancel: () => void
}

function EditNoteForm({ note, onSubmit, onCancel }: EditNoteFormProps) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>
					<T k="note.actions.edit" />
				</DialogTitle>
				<DialogDescription>
					<T k="note.actions.description" />
				</DialogDescription>
			</DialogHeader>
			<NoteForm
				note={note}
				defaultValues={{
					content: note.content,
					pinned: note.pinned || false,
					createdAt: note.createdAt
						? new Date(note.createdAt).toISOString().slice(0, 10)
						: new Date(note.$jazz.createdAt).toISOString().slice(0, 10),
				}}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>
		</>
	)
}
