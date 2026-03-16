import { TypographyH1 } from "#shared/ui/typography"
import { T, useIntl } from "#shared/intl/setup"

export function PeoplePageTitle() {
	let t = useIntl()

	return (
		<>
			<title>{t("people.pageTitle")}</title>
			<TypographyH1>
				<T k="people.title" />
			</TypographyH1>
		</>
	)
}
