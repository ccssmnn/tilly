import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl, T } from "#shared/intl/setup"
import { Link, useNavigate } from "@tanstack/react-router"
import { isTextSelectionOngoing } from "#app/lib/utils"
import { useExpanded } from "#app/hooks/use-expanded"
import { useLongPress } from "#app/hooks/use-long-press"
import {
	handleDeletePerson,
	handleAddNoteToPerson,
	handleAddReminderToPerson,
} from "../lib/person-actions"
import {
	ActivePersonListItem,
	type PersonListItemPerson,
} from "../parts/person-list-item"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"
import { NoteForm } from "#app/features/note-form"
import { ReminderForm } from "#app/features/reminder-form"
import {
	Trash,
	FileEarmarkText,
	Bell,
	PersonFill,
	ChevronUp,
} from "react-bootstrap-icons"

export { ActivePerson }

type ActivePersonProps = {
	person: PersonListItemPerson
	searchQuery?: string
	noLazy?: boolean
}

function ActivePerson({ person, searchQuery, noLazy }: ActivePersonProps) {
	let me = useAccount(UserAccount)
	let t = useIntl()
	let navigate = useNavigate()
	let [dialogOpen, setDialogOpen] = useState<"note" | "reminder">()
	let { isExpanded, toggleExpanded } = useExpanded(person.$jazz.id)
	let { handlers: longPressHandlers, didLongPress } =
		useLongPress(toggleExpanded)

	let ref = { personId: person.$jazz.id, personName: person.name }

	function deletePerson() {
		if (!me.$isLoaded) return
		handleDeletePerson(me, ref, t)
	}

	function goToPerson() {
		navigate({
			to: "/people/$personID",
			params: { personID: person.$jazz.id },
		})
	}

	async function onAddNote(data: {
		content: string
		pinned: boolean
		createdAt: string
	}) {
		if (!me.$isLoaded) return
		let result = await handleAddNoteToPerson(me, person.$jazz.id, data, t)
		if (result.ok) setDialogOpen(undefined)
	}

	async function onAddReminder(data: {
		text: string
		dueAtDate: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	}) {
		if (!me.$isLoaded) return
		let result = await handleAddReminderToPerson(me, person.$jazz.id, data, t)
		if (result.ok) setDialogOpen(undefined)
	}

	function handleLinkClick(e: React.MouseEvent) {
		if (didLongPress.current) {
			e.preventDefault()
			return
		}
		if (isTextSelectionOngoing()) {
			e.preventDefault()
			return
		}
	}

	return (
		<>
			<SwipeableListItem
				leftAction={{
					variant: "destructive",
					icon: <Trash />,
					label: <T k="person.actions.delete" />,
					onAction: deletePerson,
				}}
				rightAction={{
					variant: "primary",
					icon: <FileEarmarkText />,
					label: <T k="person.actions.addNote" />,
					onAction: () => setDialogOpen("note"),
				}}
			>
				<Link
					to="/people/$personID"
					params={{ personID: person.$jazz.id }}
					className="pointer-fine:hover:bg-muted active:bg-accent flex flex-1 rounded-lg transition-colors duration-150"
					draggable={false}
					onDragStart={e => e.preventDefault()}
					onClick={handleLinkClick}
					{...longPressHandlers}
				>
					<ActivePersonListItem
						person={person}
						searchQuery={searchQuery}
						noLazy={noLazy}
					/>
				</Link>
			</SwipeableListItem>

			<div
				className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
				style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
			>
				<div className="overflow-hidden">
					<div className="ml-19 flex items-center gap-3 pb-4">
						<ButtonGroup>
							<Button variant="outline" onClick={() => setDialogOpen("note")}>
								<FileEarmarkText />
								<span className="max-sm:sr-only">
									<T k="person.actions.addNote" />
								</span>
							</Button>
							<Button
								variant="outline"
								onClick={() => setDialogOpen("reminder")}
							>
								<Bell />
								<span className="max-sm:sr-only">
									<T k="person.actions.addReminder" />
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
								onClick={deletePerson}
								className="text-destructive"
							>
								<Trash />
								<span className="max-sm:sr-only">
									<T k="person.actions.delete" />
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

			<Dialog
				open={dialogOpen === "note"}
				onOpenChange={open => setDialogOpen(open ? "note" : undefined)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="addNote.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="addNote.description" />
						</DialogDescription>
					</DialogHeader>
					<NoteForm
						onSubmit={onAddNote}
						onCancel={() => setDialogOpen(undefined)}
					/>
				</DialogContent>
			</Dialog>
			<Dialog
				open={dialogOpen === "reminder"}
				onOpenChange={open => setDialogOpen(open ? "reminder" : undefined)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="addReminder.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="addReminder.description" />
						</DialogDescription>
					</DialogHeader>
					<ReminderForm
						onSubmit={onAddReminder}
						onCancel={() => setDialogOpen(undefined)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
