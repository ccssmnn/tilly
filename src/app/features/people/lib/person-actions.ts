import { type Loaded } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { updatePerson } from "#shared/tools/person-update"
import { createNote } from "#shared/tools/note-create"
import { createReminder } from "#shared/tools/reminder-create"
import { updateNote } from "#shared/tools/note-update"
import { updateReminder } from "#shared/tools/reminder-update"
import { permanentlyDeletePerson } from "#shared/lib/delete-covalue"
import { removeCoListRefsById } from "#shared/lib/co-list-utils"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import type { useIntl } from "#shared/intl/setup"

export {
	handleDeletePerson,
	handleRestorePerson,
	handlePermanentlyDeletePerson,
	handleAddNoteToPerson,
	handleAddReminderToPerson,
}

type T = ReturnType<typeof useIntl>
type Me = Loaded<typeof UserAccount>

type PersonRef = {
	personId: string
	personName: string
}

async function handleDeletePerson(me: Me, ref: PersonRef, t: T) {
	let result = await tryCatch(
		updatePerson(me, { personId: ref.personId, deletedAt: new Date() }),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return
	}

	toast.success(t("person.toast.deleted", { name: ref.personName }), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updatePerson(me, { personId: ref.personId, deletedAt: undefined }),
				)
				if (undo.ok) {
					toast.success(t("person.toast.restored", { name: ref.personName }))
				} else {
					toast.error(errorMessage(undo.error))
				}
			},
		},
	})
}

async function handleRestorePerson(
	me: Me,
	ref: PersonRef,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		updatePerson(me, { personId: ref.personId, deletedAt: undefined }),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	toast.success(t("person.toast.restored", { name: ref.personName }))
	return { ok: true }
}

async function handlePermanentlyDeletePerson(
	person: { $jazz: { id: string }; name: string },
	me: Me,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(permanentlyDeletePerson(person))
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	let root = (me as { root?: unknown }).root as
		| { people?: unknown; inactivePeople?: unknown }
		| undefined
	if (root?.people) removeCoListRefsById(root.people, person.$jazz.id)
	if (root?.inactivePeople) {
		removeCoListRefsById(root.inactivePeople, person.$jazz.id)
	}

	toast.success(t("person.toast.permanentlyDeleted", { name: person.name }))
	return { ok: true }
}

type NoteFormInput = {
	content: string
	pinned: boolean
	createdAt: string
}

async function handleAddNoteToPerson(
	me: Me,
	personId: string,
	data: NoteFormInput,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		createNote(me, {
			personId,
			title: "",
			content: data.content,
			pinned: data.pinned,
		}),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	toast.success(t("note.toast.added"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updateNote(me, {
						personId,
						noteId: result.data.current.noteId,
						deletedAt: new Date(),
					}),
				)
				if (undo.ok) toast.success(t("note.toast.removed"))
				else toast.error(errorMessage(undo.error))
			},
		},
	})
	return { ok: true }
}

type ReminderFormInput = {
	text: string
	dueAtDate: string
	repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
}

async function handleAddReminderToPerson(
	me: Me,
	personId: string,
	data: ReminderFormInput,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		createReminder(me, {
			personId,
			text: data.text,
			dueAtDate: data.dueAtDate,
			repeat: data.repeat,
		}),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	toast.success(t("reminder.toast.added"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updateReminder(me, {
						personId,
						reminderId: result.data.current.reminderId,
						deletedAt: new Date(),
					}),
				)
				if (undo.ok) toast.success(t("reminder.toast.removed"))
				else toast.error(errorMessage(undo.error))
			},
		},
	})
	return { ok: true }
}

function errorMessage(error: unknown): string {
	if (typeof error === "string") return error
	if (error instanceof Error) return error.message
	return "Unknown error"
}
