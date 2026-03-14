import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { UserAccount, Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import { handleMarkUndone, handleDeleteReminder } from "../lib/reminder-actions"
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "#shared/ui/dropdown-menu"
import { DoneReminderListItem } from "../parts/reminder-list-item"
import { SwipeableListItem } from "../parts/swipeable-list-item"
import { Trash, ArrowCounterclockwise, PersonFill } from "react-bootstrap-icons"

export { DoneReminder }

type DoneReminderProps = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	searchQuery?: string
}

function DoneReminder({ reminder, person, searchQuery }: DoneReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()

	let ref = {
		personId: person.$jazz.id,
		reminderId: reminder.$jazz.id,
	}

	function markUndone() {
		if (!me.$isLoaded) return
		handleMarkUndone(me, ref, t)
	}

	function remove() {
		if (!me.$isLoaded) return
		handleDeleteReminder(me, ref, t)
	}

	function goToPerson() {
		navigate({ to: "/people/$personID", params: { personID: person.$jazz.id } })
	}

	let listItem = (
		<DoneReminderListItem
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
						<DropdownMenuItem onClick={markUndone}>
							<ArrowCounterclockwise />
							<T k="reminder.done.markUndone" />
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
					onClick={goToPerson}
					rightActions={[
						{
							variant: "success",
							icon: <ArrowCounterclockwise />,
							label: <T k="reminder.done.markUndone" />,
							onAction: markUndone,
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
		</>
	)
}
