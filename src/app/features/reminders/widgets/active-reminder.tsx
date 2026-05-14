import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { useNavigate } from "@tanstack/react-router"
import { useExpanded } from "#app/hooks/use-expanded"
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
import { Collapsible } from "@base-ui/react/collapsible"
import { DialogHeader, DialogTitle, DialogDescription } from "#shared/ui/dialog"
import { ReminderFields } from "../parts/reminder-fields"
import type { ReminderFieldValues } from "../parts/reminder-fields"
import {
	CheckLg,
	PencilSquare,
	PersonFill,
	Trash,
	ChevronUp,
} from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { Button } from "#shared/ui/button"
import { ButtonGroup } from "#shared/ui/button-group"
import { testIds } from "#shared/lib/test-ids"

export { ActiveReminder }

type ActiveReminderProps = {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	showPerson?: boolean
	searchQuery?: string
}

function ActiveReminder({
	reminder,
	person,
	showPerson,
	searchQuery,
}: ActiveReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let navigate = useNavigate()
	let [editing, setEditing] = useState(false)
	let { isExpanded, setExpanded } = useExpanded(reminder.$jazz.id)

	function onOpenChange(open: boolean) {
		if (open && window.getSelection()?.toString().trim()) return
		setExpanded(open)
	}

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
		<div
			data-testid={testIds.reminder.listItem}
			data-reminder-id={reminder.$jazz.id}
			data-reminder-status="active"
		>
			<Collapsible.Root open={isExpanded} onOpenChange={onOpenChange}>
				<SwipeableListItem
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
					<Collapsible.Trigger
						nativeButton={false}
						render={<div />}
						className="flex-1"
					>
						<ReminderListItem
							reminder={reminder}
							person={showPerson !== false ? person : undefined}
							searchQuery={searchQuery}
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
							<Button
								variant="outline"
								onClick={markDone}
								data-testid={testIds.reminder.doneToggle}
							>
								<CheckLg />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.markDone" />
								</span>
							</Button>
							<Button
								variant="outline"
								onClick={() => setEditing(true)}
								data-testid={testIds.reminder.editButton}
							>
								<PencilSquare />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.edit" />
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
								onClick={remove}
								className="text-destructive"
								data-testid={testIds.reminder.deleteButton}
							>
								<Trash />
								<span className="max-sm:sr-only">
									<T k="reminder.actions.delete" />
								</span>
							</Button>
						</ButtonGroup>
					</div>
				</Collapsible.Panel>
			</Collapsible.Root>

			<Dialog open={editing} onOpenChange={setEditing}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="reminder.edit.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="reminder.edit.description" />
						</DialogDescription>
					</DialogHeader>
					<ReminderFields
						defaultValues={{
							text: reminder.text,
							dueAtDate: reminder.dueAtDate,
							repeat: reminder.repeat,
						}}
						onSubmit={onEdit}
						onCancel={() => setEditing(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
