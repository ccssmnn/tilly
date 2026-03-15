import { T, useIntl } from "#shared/intl/setup"
import { TypographyH1 } from "#shared/ui/typography"

export function NotesPageTitle() {
	let t = useIntl()

	return (
		<>
			<title>{t("notes.pageTitle")}</title>
			<TypographyH1>
				<T k="notes.title" />
			</TypographyH1>
		</>
	)
}
