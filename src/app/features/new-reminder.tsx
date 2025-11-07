import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { type ReactNode } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import { Combobox } from "#shared/ui/combobox"
import { Button } from "#shared/ui/button"
import { ReminderForm } from "#app/features/reminder-form"
import { createReminder } from "#shared/tools/reminder-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { useState } from "react"

export { NewReminder }

function NewReminder({
	children,
	onSuccess,
	personId: initialPersonId,
}: {
	children: ReactNode
	onSuccess?: (reminderId: string) => void
	personId?: string
}) {
	let { me } = useAccount(UserAccount, {
		resolve: {
			root: {
				people: {
					$each: true,
				},
			},
		},
	})
	let t = useIntl()
	let [selectedPersonId, setSelectedPersonId] = useState(initialPersonId ?? "")
	let [dialogOpen, setDialogOpen] = useState(false)

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let peopleOptions = people.map(person => ({
		value: person.$jazz.id,
		label: person.name,
	}))

	let selectedPersonLabel =
		peopleOptions.find(personOption => personOption.value === selectedPersonId)
			?.label ?? ""

	function handlePersonSelected(personId: string) {
		setSelectedPersonId(personId)
	}

	async function handleSave(values: {
		text: string
		dueAtDate: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	}) {
		if (!me || !selectedPersonId) return

		let result = await tryCatch(
			createReminder(
				{
					text: values.text,
					dueAtDate: values.dueAtDate,
					repeat: values.repeat,
				},
				{
					personId: selectedPersonId,
					userId: me.$jazz.id,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		onSuccess?.(result.data.reminderID)
		toast.success(t("reminders.created.success"))
		setDialogOpen(false)
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				titleSlot={
					<div className="relative overflow-hidden">
						<div
							className={`transition-all duration-75 ease-out ${
								!selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 -translate-x-full opacity-0"
							}`}
						>
							<DialogHeader>
								<DialogTitle>
									<T k="reminder.select.title" />
								</DialogTitle>
								<DialogDescription>
									<T k="reminder.select.description" />
								</DialogDescription>
							</DialogHeader>
						</div>

						<div
							className={`transition-all duration-75 ease-out ${
								selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 translate-x-full opacity-0"
							}`}
						>
							<DialogHeader>
								<DialogTitle>
									<T k="reminder.add.title" />
								</DialogTitle>
								<DialogDescription>
									<T
										k="reminder.add.description"
										params={{ person: selectedPersonLabel }}
									/>
								</DialogDescription>
							</DialogHeader>
						</div>
					</div>
				}
			>
				<div className="relative overflow-hidden">
					<div
						className={`transition-all duration-75 ease-out ${
							!selectedPersonId
								? "translate-x-0 opacity-100"
								: "absolute inset-0 -translate-x-full opacity-0"
						}`}
					>
						<div className="space-y-4">
							<Combobox
								items={peopleOptions}
								value={selectedPersonId}
								onValueChange={handlePersonSelected}
								placeholder={t("reminder.select.placeholder")}
								emptyText={t("reminder.select.empty")}
								searchPlaceholder={t("reminder.select.search")}
							/>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={() => setDialogOpen(false)}>
									<T k="common.cancel" />
								</Button>
							</div>
						</div>
					</div>

					<div
						className={`transition-all duration-75 ease-out ${
							selectedPersonId
								? "translate-x-0 opacity-100"
								: "absolute inset-0 translate-x-full opacity-0"
						}`}
					>
						<ReminderForm
							defaultValues={{
								text: "",
								dueAtDate: new Date().toISOString().substring(0, 10),
							}}
							onSubmit={handleSave}
							onCancel={() => {
								setSelectedPersonId(initialPersonId ?? "")
								setDialogOpen(false)
							}}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
