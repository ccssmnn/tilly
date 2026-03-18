import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import { cn } from "#app/lib/utils"
import { handleDeleteNote, handleTogglePin } from "../lib/note-actions"
import {
	ActiveNoteListItem,
	NoteImageGrid,
	contentHasOverflow,
} from "../parts/note-list-item"
import { useExpanded } from "#app/hooks/use-expanded"
import { useSelectionAwareToggle } from "#app/hooks/use-selection-aware-toggle"
import { NoteImageCarousel } from "../parts/note-image-carousel"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import { Trash, PersonFill, Pin, ChevronUp } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"

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
	let { isExpanded, toggleExpanded } = useExpanded(note.$jazz.id)
	let handleClick = useSelectionAwareToggle(isExpanded, toggleExpanded)

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

	return (
		<>
			<SwipeableListItem
				onClick={handleClick}
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
				<ActiveNoteListItem
					note={note}
					person={person}
					content={note.content}
					isExpanded={isExpanded}
					hasOverflow={hasOverflow}
					searchQuery={searchQuery}
					hidePerson={hidePerson}
				/>
			</SwipeableListItem>

			<div
				className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
				style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
			>
				<div className="overflow-hidden">
					<div
						className={cn(
							"flex items-center gap-3 pb-4",
							!hidePerson && "ml-19",
						)}
					>
						<ButtonGroup>
							<Button variant="outline" onClick={togglePin}>
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
							<Button
								variant="outline"
								onClick={remove}
								className="text-destructive"
							>
								<Trash />
								<span className="max-sm:sr-only">
									<T k="note.actions.delete" />
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
		</>
	)
}
