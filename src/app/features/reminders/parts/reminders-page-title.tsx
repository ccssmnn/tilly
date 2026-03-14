import { T, useIntl } from "#shared/intl/setup"
import { TypographyH1 } from "#shared/ui/typography"

export function RemindersPageTitle() {
	let t = useIntl()

	return (
		<>
			<title>{t("reminders.pageTitle")}</title>
			<TypographyH1>
				<T k="reminders.title" />
			</TypographyH1>
		</>
	)
}
