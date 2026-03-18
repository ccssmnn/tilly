import { z } from "zod"
import type { useIntl } from "#shared/intl/setup"

export { createReminderFormSchema }

function createReminderFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		text: z.string().min(1, t("reminder.form.text.required")),
		dueAtDate: z.string().min(1, t("reminder.form.date.required")),
		repeat: z
			.object({
				interval: z.coerce.number(),
				unit: z.enum(["day", "week", "month", "year"]),
			})
			.optional(),
	})
}
