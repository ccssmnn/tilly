import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { Person, UserAccount } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleCreateNote,
	NoteForm,
	type NoteFormValues,
} from "#app/features/notes"
import { Plus } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { format } from "date-fns"
import { testIds } from "#shared/lib/test-ids"

export { NewPersonNote }

type NewPersonNoteProps = {
	person: co.loaded<typeof Person>
	onCreated: () => void
}

function NewPersonNote({ person, onCreated }: NewPersonNoteProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [open, setOpen] = useState(false)

	async function onSubmit(values: NoteFormValues) {
		if (!me.$isLoaded) return
		let result = await handleCreateNote(
			me,
			person.$jazz.id,
			{ content: values.content, pinned: values.pinned, images: values.images },
			t,
		)
		if (result.ok) {
			setOpen(false)
			onCreated()
		}
	}

	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				data-testid={testIds.note.newButton}
			>
				<Plus />
				<span className="hidden md:inline">
					<T k="person.detail.addNote" />
				</span>
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							<T k="note.add.title" />
						</DialogTitle>
					</DialogHeader>
					<NoteForm
						defaultValues={{
							content: "",
							pinned: false,
							createdAt: format(new Date(), "yyyy-MM-dd"),
						}}
						onSubmit={onSubmit}
						onCancel={() => setOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
