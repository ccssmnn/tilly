import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleRestoreReminder,
	handlePermanentlyDeleteReminder,
} from "../lib/reminder-actions"
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "#shared/ui/dropdown-menu"
import { DeletedReminderListItem } from "../parts/reminder-list-item"
import { SwipeableListItem } from "../parts/swipeable-list-item"
import { ConfirmPermanentDelete } from "../parts/confirm-permanent-delete"
import { Trash, ArrowCounterclockwise, PersonFill } from "react-bootstrap-icons"

export { DeletedReminder }

type DeletedReminderProps = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	searchQuery?: string
}

function DeletedReminder({
	reminder,
	person,
	searchQuery,
}: DeletedReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [confirmingDelete, setConfirmingDelete] = useState(false)

	let ref = {
		personId: person.$jazz.id,
		reminderId: reminder.$jazz.id,
	}

	function restore() {
		if (!me.$isLoaded) return
		handleRestoreReminder(me, ref, t)
	}

	function goToPerson() {
		navigate({ to: "/people/$personID", params: { personID: person.$jazz.id } })
	}

	async function onConfirmPermanentDelete() {
		let result = await handlePermanentlyDeleteReminder(reminder, person, t)
		if (result.ok) setConfirmingDelete(false)
	}

	let listItem = (
		<DeletedReminderListItem
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
						<DropdownMenuItem onClick={restore}>
							<ArrowCounterclockwise />
							<T k="reminder.restore.button" />
						</DropdownMenuItem>
						<DropdownMenuItem onClick={goToPerson}>
							<PersonFill />
							<T k="reminder.actions.viewPerson" />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setConfirmingDelete(true)}
						>
							<Trash />
							<T k="reminder.permanentDelete.confirm" />
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="pointer-fine:hidden">
				<SwipeableListItem
					onClick={goToPerson}
					rightActions={[
						{
							variant: "success",
							icon: <ArrowCounterclockwise />,
							label: <T k="reminder.restore.button" />,
							onAction: restore,
						},
					]}
					leftActions={[
						{
							variant: "destructive",
							icon: <Trash />,
							label: <T k="reminder.permanentDelete.confirm" />,
							onAction: () => setConfirmingDelete(true),
						},
					]}
				>
					{listItem}
				</SwipeableListItem>
			</div>

			<ConfirmPermanentDelete
				open={confirmingDelete}
				onOpenChange={setConfirmingDelete}
				onConfirm={onConfirmPermanentDelete}
			/>
		</>
	)
}
