import { useIntl, T } from "#shared/intl/setup"
import { TypographyH1 } from "#shared/ui/typography"

export { SettingsPageTitle }

function SettingsPageTitle() {
	let t = useIntl()

	return (
		<>
			<title>{t("settings.pageTitle")}</title>
			<TypographyH1>
				<T k="settings.title" />
			</TypographyH1>
		</>
	)
}
