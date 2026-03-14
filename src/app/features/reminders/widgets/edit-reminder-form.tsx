import { Reminder } from "#shared/schema/user"
import { co } from "jazz-tools"
import { T } from "#shared/intl/setup"
import { DialogHeader, DialogTitle, DialogDescription } from "#shared/ui/dialog"
import {
	ReminderFields,
	type ReminderFieldValues,
} from "../parts/reminder-fields"

export { EditReminderForm }

type EditReminderFormProps = {
	reminder: co.loaded<typeof Reminder>
	onSubmit: (values: ReminderFieldValues) => void
	onCancel: () => void
}

function EditReminderForm({
	reminder,
	onSubmit,
	onCancel,
}: EditReminderFormProps) {
	return (
		<>
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
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>
		</>
	)
}
