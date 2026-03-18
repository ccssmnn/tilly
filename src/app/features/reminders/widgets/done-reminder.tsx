import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { useExpanded } from "#app/hooks/use-expanded"
import { useSelectionAwareToggle } from "#app/hooks/use-selection-aware-toggle"
import { UserAccount, Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import { handleMarkUndone, handleDeleteReminder } from "../lib/reminder-actions"
import { DoneReminderListItem } from "../parts/reminder-list-item"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import {
	Trash,
	ArrowCounterclockwise,
	PersonFill,
	ChevronUp,
} from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"

export { DoneReminder }

type DoneReminderProps = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	showPerson?: boolean
	searchQuery?: string
}

function DoneReminder({
	reminder,
	person,
	showPerson,
	searchQuery,
}: DoneReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let { isExpanded, toggleExpanded } = useExpanded(reminder.$jazz.id)
	let handleClick = useSelectionAwareToggle(isExpanded, toggleExpanded)

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
					variant: "success",
					icon: <ArrowCounterclockwise />,
					label: <T k="reminder.done.markUndone" />,
					onAction: markUndone,
				}}
				leftAction={{
					variant: "destructive",
					icon: <Trash />,
					label: <T k="reminder.actions.delete" />,
					onAction: remove,
				}}
			>
				<DoneReminderListItem
					reminder={reminder}
					person={showPerson !== false ? person : undefined}
					searchQuery={searchQuery}
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
							showPerson !== false && "ml-19",
						)}
					>
						<ButtonGroup>
							<Button variant="outline" onClick={markUndone}>
								<ArrowCounterclockwise />
								<span className="max-sm:sr-only">
									<T k="reminder.done.markUndone" />
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
		</>
	)
}
