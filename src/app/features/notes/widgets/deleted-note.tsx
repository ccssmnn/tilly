import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import { cn } from "#app/lib/utils"
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
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import { Collapsible } from "@base-ui/react/collapsible"
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
	hidePerson?: boolean
}

function DeletedNote({
	note,
	person,
	searchQuery,
	hidePerson,
}: DeletedNoteProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [confirmingDelete, setConfirmingDelete] = useState(false)
	let { isExpanded, setExpanded } = useExpanded(note.$jazz.id)

	function onOpenChange(open: boolean) {
		if (open && window.getSelection()?.toString().trim()) return
		setExpanded(open)
	}

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
			<Collapsible.Root open={isExpanded} onOpenChange={onOpenChange}>
				<SwipeableListItem
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
					<Collapsible.Trigger render={<div />} className="flex-1">
						<DeletedNoteListItem
							note={note}
							person={person}
							content={note.content}
							isExpanded={isExpanded}
							hasOverflow={hasOverflow}
							searchQuery={searchQuery}
							hidePerson={hidePerson}
						/>
					</Collapsible.Trigger>
				</SwipeableListItem>

				<Collapsible.Panel keepMounted className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-300 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
					<div
						className={cn(
							"flex items-center gap-3 pb-4",
							!hidePerson && "ml-19",
						)}
					>
						<ButtonGroup>
							<Button variant="outline" onClick={() => setExpanded(false)}>
								<ChevronUp />
								<span className="max-sm:sr-only">
									<T k="note.showLess" />
								</span>
							</Button>
							<Button variant="outline" onClick={restore}>
								<ArrowCounterclockwise />
								<span className="max-sm:sr-only">
									<T k="note.restore.button" />
								</span>
							</Button>
							{!hidePerson && (
								<Button variant="outline" onClick={goToPerson}>
									<PersonFill />
									<span className="max-sm:sr-only">
										<T k="note.actions.viewPerson" />
									</span>
								</Button>
							)}
						</ButtonGroup>
						<div className="flex-1" />
						<ButtonGroup>
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
					</div>
				</Collapsible.Panel>
			</Collapsible.Root>

			<NoteImageGrid
				note={note}
				isDeleted={true}
				hidePerson={hidePerson}
				onImageClick={() => {}}
			/>

			<ConfirmPermanentDelete
				open={confirmingDelete}
				onOpenChange={setConfirmingDelete}
				onConfirm={onConfirmPermanentDelete}
			/>
		</>
	)
}
