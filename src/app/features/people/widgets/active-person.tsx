import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl, T } from "#shared/intl/setup"
import { useNavigate } from "@tanstack/react-router"
import { useExpanded } from "#app/hooks/use-expanded"
import { Collapsible } from "@base-ui/react/collapsible"
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
import { InlineNoteForm as NoteForm } from "#app/features/notes"
import { ReminderForm } from "#app/features/reminders"
import {
	Trash,
	FileEarmarkText,
	Bell,
	PersonFill,
	ChevronUp,
} from "react-bootstrap-icons"
import { testIds } from "#shared/lib/test-ids"

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
	let { isExpanded, setExpanded } = useExpanded(person.$jazz.id)

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

	return (
		<div
			data-testid={testIds.person.listItem}
			data-person-id={person.$jazz.id}
			data-person-status="active"
		>
			<Collapsible.Root open={isExpanded} onOpenChange={setExpanded}>
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
					<Collapsible.Trigger
						nativeButton={false}
						render={<div />}
						className="flex flex-1 rounded-lg"
					>
						<ActivePersonListItem
							person={person}
							searchQuery={searchQuery}
							noLazy={noLazy}
						/>
					</Collapsible.Trigger>
				</SwipeableListItem>

				<Collapsible.Panel
					keepMounted
					className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-300 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
				>
					<div className="ml-19 flex items-center gap-3 pb-4">
						<ButtonGroup>
							<Button variant="outline" onClick={() => setExpanded(false)}>
								<ChevronUp />
								<span className="max-sm:sr-only">
									<T k="note.showLess" />
								</span>
							</Button>
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
						</ButtonGroup>
						<div className="flex-1" />
						<ButtonGroup>
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
					</div>
				</Collapsible.Panel>
			</Collapsible.Root>

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
		</div>
	)
}
