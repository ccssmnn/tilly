import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import { cn } from "#app/lib/utils"
import {
	handleDeleteNote,
	handleEditNote,
	handleTogglePin,
} from "../lib/note-actions"
import {
	ActiveNoteListItem,
	NoteImageGrid,
	contentHasOverflow,
} from "../parts/note-list-item"
import { useExpanded } from "#app/hooks/use-expanded"
import { NoteImageCarousel } from "../parts/note-image-carousel"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import { Collapsible } from "@base-ui/react/collapsible"
import {
	Trash,
	PersonFill,
	Pin,
	ChevronUp,
	PencilSquare,
} from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { NoteForm } from "./inline-note-form"
import { format } from "date-fns"
import type { NoteFormValues } from "../lib/note-form-schema"
import { testIds } from "#shared/lib/test-ids"

export { ActiveNote }

type ActiveNoteProps = {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	searchQuery?: string
	hidePerson?: boolean
}

function ActiveNote({
	note,
	person,
	searchQuery,
	hidePerson,
}: ActiveNoteProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [carouselOpen, setCarouselOpen] = useState(false)
	let [selectedImageIndex, setSelectedImageIndex] = useState(0)
	let [editDialogOpen, setEditDialogOpen] = useState(false)
	let { isExpanded, setExpanded } = useExpanded(note.$jazz.id)

	function onOpenChange(open: boolean) {
		if (open && window.getSelection()?.toString().trim()) return
		setExpanded(open)
	}

	let ref = { personId: person.$jazz.id, noteId: note.$jazz.id }

	let hasOverflow = contentHasOverflow(note.content)

	function remove() {
		if (!me.$isLoaded) return
		handleDeleteNote(me, ref, t)
	}

	function togglePin() {
		if (!me.$isLoaded) return
		handleTogglePin(me, ref, note.pinned ?? false, t)
	}

	function goToPerson() {
		navigate({
			to: "/people/$personID",
			params: { personID: person.$jazz.id },
		})
	}

	async function onEditNote(data: NoteFormValues) {
		if (!me.$isLoaded) return
		let result = await handleEditNote(me, ref, data, t)
		if (result.ok) setEditDialogOpen(false)
	}

	return (
		<div
			data-testid={testIds.note.listItem}
			data-note-id={note.$jazz.id}
			data-note-status="active"
		>
			<Collapsible.Root open={isExpanded} onOpenChange={onOpenChange}>
				<SwipeableListItem
					rightAction={{
						variant: "primary",
						icon: <Pin />,
						label: note.pinned ? (
							<T k="note.actions.unpin" />
						) : (
							<T k="note.actions.pin" />
						),
						onAction: togglePin,
					}}
					leftAction={{
						variant: "destructive",
						icon: <Trash />,
						label: <T k="note.actions.delete" />,
						onAction: remove,
					}}
				>
					<Collapsible.Trigger
						nativeButton={false}
						render={<div />}
						className="flex-1"
					>
						<ActiveNoteListItem
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

				<Collapsible.Panel
					keepMounted
					className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-300 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
				>
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
							<Button
								variant="outline"
								onClick={() => setEditDialogOpen(true)}
								data-testid={testIds.note.editButton}
							>
								<PencilSquare />
								<span className="max-sm:sr-only">
									<T k="note.actions.edit" />
								</span>
							</Button>
							<Button
								variant="outline"
								onClick={togglePin}
								data-testid={testIds.note.pinButton}
							>
								<Pin />
								<span className="max-sm:sr-only">
									{note.pinned ? (
										<T k="note.actions.unpin" />
									) : (
										<T k="note.actions.pin" />
									)}
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
								onClick={remove}
								className="text-destructive"
								data-testid={testIds.note.deleteButton}
							>
								<Trash />
								<span className="max-sm:sr-only">
									<T k="note.actions.delete" />
								</span>
							</Button>
						</ButtonGroup>
					</div>
				</Collapsible.Panel>
			</Collapsible.Root>

			<NoteImageGrid
				note={note}
				isDeleted={false}
				hidePerson={hidePerson}
				onImageClick={index => {
					setSelectedImageIndex(index)
					setCarouselOpen(true)
				}}
			/>

			<NoteImageCarousel
				note={note}
				selectedIndex={selectedImageIndex}
				open={carouselOpen}
				onClose={() => setCarouselOpen(false)}
			/>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="note.edit.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="note.edit.description" />
						</DialogDescription>
					</DialogHeader>
					<NoteForm
						note={note}
						defaultValues={{
							content: note.content,
							pinned: note.pinned ?? false,
							createdAt: note.createdAt
								? format(new Date(note.createdAt), "yyyy-MM-dd")
								: "",
						}}
						onSubmit={onEditNote}
						onCancel={() => setEditDialogOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
