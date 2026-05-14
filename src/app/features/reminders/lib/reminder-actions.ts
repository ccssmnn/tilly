import { co, type Loaded } from "jazz-tools"
import { UserAccount, Person, Reminder } from "#shared/schema/user"
import { createReminder } from "#shared/tools/reminder-create"
import { updateReminder } from "#shared/tools/reminder-update"
import { permanentlyDeleteReminder } from "#shared/lib/delete-covalue"
import { removeCoListRefsById } from "#shared/lib/co-list-utils"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import type { useIntl } from "#shared/intl/setup"

export {
	handleCreateReminder,
	handleMarkDone,
	handleMarkUndone,
	handleEditReminder,
	handleDeleteReminder,
	handleRestoreReminder,
	handlePermanentlyDeleteReminder,
}

type T = ReturnType<typeof useIntl>
type Me = Loaded<typeof UserAccount>

type ReminderRef = {
	personId: string
	reminderId: string
}

type ReminderFormValues = {
	text: string
	dueAtDate: string
	repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
}

async function handleCreateReminder(
	me: Me,
	personId: string,
	values: ReminderFormValues,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		createReminder(me, {
			personId,
			text: values.text,
			dueAtDate: values.dueAtDate,
			repeat: values.repeat,
		}),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}
	toast.success(t("reminders.created.success"))
	return { ok: true }
}

async function handleMarkDone(me: Me, ref: ReminderRef, t: T) {
	let result = await tryCatch(updateReminder(me, { ...ref, done: true }))
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return
	}

	let wasRepeating = result.data.previous.repeat !== undefined
	let wasRescheduled = wasRepeating && !result.data.current.done

	toast.success(
		wasRescheduled
			? t("reminder.toast.rescheduled")
			: t("reminder.toast.markedDone"),
		{
			action: {
				label: t("common.undo"),
				onClick: async () => {
					let undoUpdates = wasRescheduled
						? { done: false, dueAtDate: result.data.previous.dueAtDate }
						: { done: false }
					let undo = await tryCatch(
						updateReminder(me, { ...ref, ...undoUpdates }),
					)
					if (undo.ok) {
						toast.success(
							wasRescheduled
								? t("reminder.toast.restoredToPreviousDate")
								: t("reminder.toast.markedNotDone"),
						)
					} else {
						toast.error(errorMessage(undo.error))
					}
				},
			},
		},
	)
}

async function handleMarkUndone(me: Me, ref: ReminderRef, t: T) {
	let result = await tryCatch(updateReminder(me, { ...ref, done: false }))
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return
	}

	toast.success(t("reminder.toast.markedUndone"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(updateReminder(me, { ...ref, done: true }))
				if (undo.ok) {
					toast.success(t("reminder.toast.markedDoneAgain"))
				} else {
					toast.error(errorMessage(undo.error))
				}
			},
		},
	})
}

async function handleEditReminder(
	me: Me,
	ref: ReminderRef,
	values: ReminderFormValues,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		updateReminder(me, {
			...ref,
			text: values.text,
			dueAtDate: values.dueAtDate,
			repeat: values.repeat,
		}),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	let { previous } = result.data
	toast.success(t("reminder.toast.updated"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updateReminder(me, {
						...ref,
						text: previous.text,
						dueAtDate: previous.dueAtDate,
						repeat: previous.repeat,
					}),
				)
				if (undo.ok) {
					toast.success(t("reminder.toast.updateUndone"))
				} else {
					toast.error(errorMessage(undo.error))
				}
			},
		},
	})
	return { ok: true }
}

async function handleDeleteReminder(me: Me, ref: ReminderRef, t: T) {
	let result = await tryCatch(
		updateReminder(me, { ...ref, deletedAt: new Date() }),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return
	}

	toast.success(t("reminder.toast.deleted"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updateReminder(me, { ...ref, deletedAt: undefined }),
				)
				if (undo.ok) {
					toast.success(t("reminder.toast.restored"))
				} else {
					toast.error(errorMessage(undo.error))
				}
			},
		},
	})
}

async function handleRestoreReminder(
	me: Me,
	ref: ReminderRef,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		updateReminder(me, { ...ref, deletedAt: undefined }),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}
	toast.success(t("reminder.toast.restored"))
	return { ok: true }
}

async function handlePermanentlyDeleteReminder(
	reminder: co.loaded<typeof Reminder>,
	person: co.loaded<typeof Person>,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(permanentlyDeleteReminder(reminder))
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	removeCoListRefsById(person.reminders, reminder.$jazz.id)
	if (person.inactiveReminders) {
		removeCoListRefsById(person.inactiveReminders, reminder.$jazz.id)
	}

	toast.success(t("reminder.toast.permanentlyDeleted"))
	return { ok: true }
}

function errorMessage(error: unknown): string {
	if (typeof error === "string") return error
	if (error instanceof Error) return error.message
	return "Unknown error"
}
