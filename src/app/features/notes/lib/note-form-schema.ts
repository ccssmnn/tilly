import { z } from "zod"
import type { useIntl } from "#shared/intl/setup"

export { createNoteFormSchema }
export type { NoteFormValues }

type NoteFormValues = {
	content: string
	images?: File[]
	removedImageIds?: string[]
	pinned: boolean
	createdAt: string
}

function createNoteFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		content: z.string().min(1, t("note.form.content.required")),
		images: z.array(z.instanceof(File)).max(10).optional(),
		removedImageIds: z.array(z.string()).optional(),
		pinned: z.boolean(),
		createdAt: z.string().min(1, t("note.form.createdAt.required")),
	})
}
