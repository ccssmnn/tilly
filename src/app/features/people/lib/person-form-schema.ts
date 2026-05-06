import { z } from "zod"
import type { useIntl } from "#shared/intl/setup"

export { createPersonFormSchema }
export type { PersonFormValues }

function createPersonFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		name: z.string().min(1, t("person.form.name.required")),
		summary: z.string().optional(),
		avatar: z.instanceof(File).nullable().optional(),
	})
}

type PersonFormValues = {
	name: string
	summary?: string
	avatar?: File | null
}
