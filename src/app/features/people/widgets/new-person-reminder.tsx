import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { Person, UserAccount } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useIntl, T } from "#shared/intl/setup"
import { handleCreateReminder } from "#app/features/reminders"
import { ReminderForm } from "#app/features/reminders"
import { Plus } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { testIds } from "#shared/lib/test-ids"

export { NewPersonReminder }

type NewPersonReminderProps = {
	person: co.loaded<typeof Person>
	onCreated: () => void
}

function NewPersonReminder({ person, onCreated }: NewPersonReminderProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [open, setOpen] = useState(false)

	async function onSubmit(values: {
		text: string
		dueAtDate: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	}) {
		if (!me.$isLoaded) return
		let result = await handleCreateReminder(me, person.$jazz.id, values, t)
		if (result.ok) {
			setOpen(false)
			onCreated()
		}
	}

	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				data-testid={testIds.reminder.newButton}
			>
				<Plus />
				<span className="hidden md:inline">
					<T k="person.detail.addReminder" />
				</span>
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							<T k="reminders.add.title" />
						</DialogTitle>
					</DialogHeader>
					<ReminderForm
						defaultValues={{
							text: "",
							dueAtDate: new Date().toISOString().substring(0, 10),
						}}
						onSubmit={onSubmit}
						onCancel={() => setOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
