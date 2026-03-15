import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleRestoreNote,
	handlePermanentlyDeleteNote,
} from "../lib/note-actions"
import {
	DeletedNoteListItem,
	NoteImageGrid,
	contentHasOverflow,
} from "../parts/note-list-item"
import { useExpanded } from "#app/hooks/use-expanded"
import { useSelectionAwareToggle } from "#app/hooks/use-selection-aware-toggle"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import { ConfirmPermanentDelete } from "../parts/confirm-permanent-delete"
import {
	Trash,
	ArrowCounterclockwise,
	PersonFill,
	ChevronUp,
} from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"

export { DeletedNote }

type DeletedNoteProps = {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	searchQuery?: string
}

function DeletedNote({ note, person, searchQuery }: DeletedNoteProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [confirmingDelete, setConfirmingDelete] = useState(false)
	let { isExpanded, toggleExpanded } = useExpanded(note.$jazz.id)
	let handleClick = useSelectionAwareToggle(isExpanded, toggleExpanded)

	let ref = { personId: person.$jazz.id, noteId: note.$jazz.id }

	let hasOverflow = contentHasOverflow(note.content)

	function restore() {
		if (!me.$isLoaded) return
		handleRestoreNote(me, ref, t)
	}

	function goToPerson() {
		navigate({
			to: "/people/$personID",
			params: { personID: person.$jazz.id },
		})
	}

	async function onConfirmPermanentDelete() {
		let result = await handlePermanentlyDeleteNote(note, person, t)
		if (result.ok) setConfirmingDelete(false)
	}

	return (
		<>
			<SwipeableListItem
				onClick={handleClick}
				rightAction={{
					variant: "success",
					icon: <ArrowCounterclockwise />,
					label: <T k="note.restore.button" />,
					onAction: restore,
				}}
				leftAction={{
					variant: "destructive",
					icon: <Trash />,
					label: <T k="note.permanentDelete.confirm" />,
					onAction: () => setConfirmingDelete(true),
				}}
			>
				<DeletedNoteListItem
					note={note}
					person={person}
					content={note.content}
					isExpanded={isExpanded}
					hasOverflow={hasOverflow}
					searchQuery={searchQuery}
				/>
			</SwipeableListItem>

			<div
				className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
				style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
			>
				<div className="overflow-hidden">
					<div className="ml-19 flex items-center gap-3 pb-4">
						<ButtonGroup>
							<Button variant="outline" onClick={restore}>
								<ArrowCounterclockwise />
								<span className="max-sm:sr-only">
									<T k="note.restore.button" />
								</span>
							</Button>
							<Button variant="outline" onClick={goToPerson}>
								<PersonFill />
								<span className="max-sm:sr-only">
									<T k="note.actions.viewPerson" />
								</span>
							</Button>
							<Button
								variant="outline"
								onClick={() => setConfirmingDelete(true)}
								className="text-destructive"
							>
								<Trash />
								<span className="max-sm:sr-only">
									<T k="note.permanentDelete.confirm" />
								</span>
							</Button>
						</ButtonGroup>
						<div className="flex-1" />
						<ButtonGroup>
							<Button variant="outline" onClick={toggleExpanded}>
								<ChevronUp />
								<span className="max-sm:sr-only">
									<T k="note.showLess" />
								</span>
							</Button>
						</ButtonGroup>
					</div>
				</div>
			</div>

			<NoteImageGrid note={note} isDeleted={true} onImageClick={() => {}} />

			<ConfirmPermanentDelete
				open={confirmingDelete}
				onOpenChange={setConfirmingDelete}
				onConfirm={onConfirmPermanentDelete}
			/>
		</>
	)
}
