import { co, type Loaded } from "jazz-tools"
import { UserAccount, Person, Note } from "#shared/schema/user"
import { createNote } from "#shared/tools/note-create"
import { updateNote } from "#shared/tools/note-update"
import { permanentlyDeleteNote } from "#shared/lib/delete-covalue"
import { removeCoListRefsById } from "#shared/lib/co-list-utils"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import type { useIntl } from "#shared/intl/setup"

export {
	handleCreateNote,
	handleEditNote,
	handleDeleteNote,
	handleTogglePin,
	handleRestoreNote,
	handlePermanentlyDeleteNote,
}

type T = ReturnType<typeof useIntl>
type Me = Loaded<typeof UserAccount>

type NoteRef = {
	personId: string
	noteId: string
}

async function handleCreateNote(
	me: Me,
	personId: string,
	values: { content: string; pinned: boolean; images?: File[] },
	t: T,
): Promise<{ ok: boolean; noteId?: string }> {
	let result = await tryCatch(
		createNote(
			{
				title: "",
				content: values.content,
				pinned: values.pinned,
				imageFiles: values.images,
			},
			{ personId, worker: me },
		),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}
	toast.success(t("notes.created.success"))
	return { ok: true, noteId: result.data.noteID }
}

async function handleEditNote(
	me: Me,
	ref: NoteRef,
	values: {
		content?: string
		pinned?: boolean
		images?: File[]
		removedImageIds?: string[]
	},
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		updateNote(
			{
				content: values.content,
				pinned: values.pinned,
				imageFiles: values.images,
				removedImageIds: values.removedImageIds,
			},
			{ personId: ref.personId, noteId: ref.noteId, worker: me },
		),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	toast.success(t("note.toast.updated"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updateNote(result.data.previous, {
						personId: ref.personId,
						noteId: ref.noteId,
						worker: me,
					}),
				)
				if (undo.ok) toast.success(t("note.toast.updateUndone"))
				else toast.error(errorMessage(undo.error))
			},
		},
	})
	return { ok: true }
}

async function handleDeleteNote(me: Me, ref: NoteRef, t: T) {
	let result = await tryCatch(
		updateNote(
			{ deletedAt: new Date() },
			{ personId: ref.personId, noteId: ref.noteId, worker: me },
		),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return
	}

	toast.success(t("note.toast.deleted"), {
		action: {
			label: t("common.undo"),
			onClick: async () => {
				let undo = await tryCatch(
					updateNote(
						{ deletedAt: undefined },
						{ personId: ref.personId, noteId: ref.noteId, worker: me },
					),
				)
				if (undo.ok) toast.success(t("note.toast.restored"))
				else toast.error(errorMessage(undo.error))
			},
		},
	})
}

async function handleTogglePin(me: Me, ref: NoteRef, pinned: boolean, t: T) {
	let newPinned = !pinned
	let result = await tryCatch(
		updateNote(
			{ pinned: newPinned },
			{ personId: ref.personId, noteId: ref.noteId, worker: me },
		),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return
	}

	toast.success(newPinned ? t("note.toast.pinned") : t("note.toast.unpinned"))
}

async function handleRestoreNote(
	me: Me,
	ref: NoteRef,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(
		updateNote(
			{ deletedAt: undefined },
			{ personId: ref.personId, noteId: ref.noteId, worker: me },
		),
	)
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}
	toast.success(t("note.toast.restored"))
	return { ok: true }
}

async function handlePermanentlyDeleteNote(
	note: co.loaded<typeof Note>,
	person: co.loaded<typeof Person>,
	t: T,
): Promise<{ ok: boolean }> {
	let result = await tryCatch(permanentlyDeleteNote(note))
	if (!result.ok) {
		toast.error(errorMessage(result.error))
		return { ok: false }
	}

	removeCoListRefsById(person.notes, note.$jazz.id)
	if (person.inactiveNotes) {
		removeCoListRefsById(person.inactiveNotes, note.$jazz.id)
	}

	toast.success(t("note.toast.permanentlyDeleted"))
	return { ok: true }
}

function errorMessage(error: unknown): string {
	if (typeof error === "string") return error
	if (error instanceof Error) return error.message
	return "Unknown error"
}
