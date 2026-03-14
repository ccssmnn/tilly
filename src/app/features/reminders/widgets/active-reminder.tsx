import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleMarkDone,
	handleEditReminder,
	handleDeleteReminder,
} from "../lib/reminder-actions"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "#shared/ui/dropdown-menu"
import { ReminderListItem } from "../parts/reminder-list-item"
import { SwipeableListItem } from "../parts/swipeable-list-item"
import { EditReminderForm } from "./edit-reminder-form"
import type { ReminderFieldValues } from "../parts/reminder-fields"
import { CheckLg, PencilSquare, PersonFill, Trash } from "react-bootstrap-icons"

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
		navigate({ to: "/people/$personID", params: { personID: person.$jazz.id } })
	}

	async function onEdit(values: ReminderFieldValues) {
		if (!me.$isLoaded) return
		let result = await handleEditReminder(me, ref, values, t)
		if (result.ok) setEditing(false)
	}

	let listItem = (
		<ReminderListItem
			reminder={reminder}
			person={person}
			searchQuery={searchQuery}
		/>
	)

	return (
		<>
			<div className="pointer-coarse:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger className="hover:bg-accent data-popup-open:bg-accent -mx-3 w-[calc(100%+1.5rem)] cursor-default rounded-xl px-3 text-left outline-none">
						{listItem}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center" className="w-auto">
						<DropdownMenuItem onClick={markDone}>
							<CheckLg />
							<T k="reminder.actions.markDone" />
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setEditing(true)}>
							<PencilSquare />
							<T k="reminder.actions.edit" />
						</DropdownMenuItem>
						<DropdownMenuItem onClick={goToPerson}>
							<PersonFill />
							<T k="reminder.actions.viewPerson" />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onClick={remove}>
							<Trash />
							<T k="reminder.actions.delete" />
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="pointer-fine:hidden">
				<SwipeableListItem
					onClick={() => setEditing(true)}
					rightActions={[
						{
							variant: "success",
							icon: <CheckLg />,
							label: <T k="reminder.actions.markDone" />,
							onAction: markDone,
						},
						{
							variant: "warning",
							icon: <PersonFill />,
							label: <T k="reminder.actions.viewPerson" />,
							onAction: goToPerson,
						},
					]}
					leftActions={[
						{
							variant: "destructive",
							icon: <Trash />,
							label: <T k="reminder.actions.delete" />,
							onAction: remove,
						},
					]}
				>
					{listItem}
				</SwipeableListItem>
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
