import { z } from "zod"
import type { useIntl } from "#shared/intl/setup"

export { getFormSchema }

function getFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		listName: z
			.string()
			.min(1, t("person.listForm.validation.nameRequired"))
			.regex(/^[a-z0-9_]+$/, t("person.listForm.validation.nameFormat")),
		selectedPeople: z
			.set(z.string())
			.min(1, t("person.listForm.validation.peopleRequired")),
	})
}
