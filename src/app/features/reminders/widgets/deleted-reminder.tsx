import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { useExpanded } from "#app/hooks/use-expanded"
import { UserAccount, Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleRestoreReminder,
	handlePermanentlyDeleteReminder,
} from "../lib/reminder-actions"
import { getDeletedDate } from "../lib/reminder-dates"
import { DeletedReminderListItem } from "../parts/reminder-list-item"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
import { Collapsible } from "@base-ui/react/collapsible"
import { ConfirmPermanentDelete } from "../parts/confirm-permanent-delete"
import {
	Trash,
	ArrowCounterclockwise,
	PersonFill,
	ChevronUp,
} from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"

export { DeletedReminder }

type DeletedReminderProps = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	showPerson?: boolean
	searchQuery?: string
}

function DeletedReminder({
	reminder,
	person,
	showPerson,
	searchQuery,
}: DeletedReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [confirmingDelete, setConfirmingDelete] = useState(false)
	let { isExpanded, setExpanded } = useExpanded(reminder.$jazz.id)

	function onOpenChange(open: boolean) {
		if (open && window.getSelection()?.toString().trim()) return
		setExpanded(open)
	}

	let ref = {
		personId: person.$jazz.id,
		reminderId: reminder.$jazz.id,
	}

	function restore() {
		if (!me.$isLoaded) return
		handleRestoreReminder(me, ref, t)
	}

	function goToPerson() {
		navigate({
			to: "/people/$personID",
			params: { personID: person.$jazz.id },
		})
	}

	async function onConfirmPermanentDelete() {
		let result = await handlePermanentlyDeleteReminder(reminder, person, t)
		if (result.ok) setConfirmingDelete(false)
	}

	return (
		<>
			<Collapsible.Root open={isExpanded} onOpenChange={onOpenChange}>
				<SwipeableListItem
					rightAction={{
						variant: "success",
						icon: <ArrowCounterclockwise />,
						label: <T k="reminder.restore.button" />,
						onAction: restore,
					}}
					leftAction={{
						variant: "destructive",
						icon: <Trash />,
						label: <T k="reminder.permanentDelete.confirm" />,
						onAction: () => setConfirmingDelete(true),
					}}
				>
					<Collapsible.Trigger nativeButton={false} render={<div />} className="flex-1">
						<DeletedReminderListItem
							reminder={reminder}
							person={showPerson !== false ? person : undefined}
							searchQuery={searchQuery}
							deletedDate={getDeletedDate(reminder)}
						/>
					</Collapsible.Trigger>
				</SwipeableListItem>

				<Collapsible.Panel keepMounted className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-300 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
					<div
						className={cn(
							"flex items-center gap-3 pb-4",
							showPerson !== false && "ml-19",
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
									<T k="reminder.restore.button" />
								</span>
							</Button>
							{showPerson !== false && (
								<Button variant="outline" onClick={goToPerson}>
									<PersonFill />
									<span className="max-sm:sr-only">
										<T k="reminder.actions.viewPerson" />
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
									<T k="reminder.permanentDelete.confirm" />
								</span>
							</Button>
						</ButtonGroup>
					</div>
				</Collapsible.Panel>
			</Collapsible.Root>

			<ConfirmPermanentDelete
				open={confirmingDelete}
				onOpenChange={setConfirmingDelete}
				onConfirm={onConfirmPermanentDelete}
			/>
		</>
	)
}
