import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { useExpanded } from "#app/hooks/use-expanded"
import { useSelectionAwareToggle } from "#app/hooks/use-selection-aware-toggle"
import { UserAccount, Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleMarkDone,
	handleEditReminder,
	handleDeleteReminder,
} from "../lib/reminder-actions"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import { ReminderListItem } from "../parts/reminder-list-item"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import { EditReminderForm } from "./edit-reminder-form"
import type { ReminderFieldValues } from "../parts/reminder-fields"
import {
	CheckLg,
	PencilSquare,
	PersonFill,
	Trash,
	ChevronUp,
} from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"

export { ActiveReminder }

type ActiveReminderProps = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	searchQuery?: string
}

function ActiveReminder({
	reminder,
	person,
	searchQuery,
}: ActiveReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [editing, setEditing] = useState(false)
	let { isExpanded, toggleExpanded } = useExpanded(reminder.$jazz.id)
	let handleClick = useSelectionAwareToggle(isExpanded, toggleExpanded)

	let ref = {
		personId: person.$jazz.id,
		reminderId: reminder.$jazz.id,
	}

	function markDone() {
		if (!me.$isLoaded) return
		handleMarkDone(me, ref, t)
	}

	function remove() {
		if (!me.$isLoaded) return
		handleDeleteReminder(me, ref, t)
	}

	function goToPerson() {
		navigate({
			to: "/people/$personID",
			params: { personID: person.$jazz.id },
		})
	}

	async function onEdit(values: ReminderFieldValues) {
		if (!me.$isLoaded) return
		let result = await handleEditReminder(me, ref, values, t)
		if (result.ok) setEditing(false)
	}

	return (
		<>
			<SwipeableListItem
				onClick={handleClick}
				rightAction={{
					variant: "success",
					icon: <CheckLg />,
					label: <T k="reminder.actions.markDone" />,
					onAction: markDone,
				}}
				leftAction={{
					variant: "destructive",
					icon: <Trash />,
					label: <T k="reminder.actions.delete" />,
					onAction: remove,
				}}
			>
				<ReminderListItem
					reminder={reminder}
					person={person}
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
							<Button variant="outline" onClick={markDone}>
								<CheckLg />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.markDone" />
								</span>
							</Button>
							<Button variant="outline" onClick={() => setEditing(true)}>
								<PencilSquare />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.edit" />
								</span>
							</Button>
							<Button variant="outline" onClick={goToPerson}>
								<PersonFill />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.viewPerson" />
								</span>
							</Button>
							<Button
								variant="outline"
								onClick={remove}
								className="text-destructive"
							>
								<Trash />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.delete" />
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

			<Dialog open={editing} onOpenChange={setEditing}>
				<DialogContent>
					<EditReminderForm
						reminder={reminder}
						onSubmit={onEdit}
						onCancel={() => setEditing(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
