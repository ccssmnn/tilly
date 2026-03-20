import { Label } from "#shared/ui/label"
import { TypographyMuted } from "#shared/ui/typography"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shared/ui/select"
import { T, useIntl } from "#shared/intl/setup"
import { SettingsSection } from "#app/features/settings/parts/settings-section"
import { sectionStackClass } from "../lib/layout"
import type { SettingsAccount } from "../lib/data"

export { LanguageSection }

const languages = { en: "language.name.en", de: "language.name.de" } as const

function LanguageSection({ me }: { me: SettingsAccount }) {
	let t = useIntl()
	let currentLang = (me.root.language || "en") as keyof typeof languages

	function setLanguage(lang: "de" | "en") {
		me.root.$jazz.set("language", lang)
	}

	return (
		<SettingsSection
			title={t("settings.language.title")}
			description={t("settings.language.description")}
		>
			<div className={sectionStackClass}>
				<div className="space-y-2.5">
					<Label>
						<T k="settings.language.select.label" />
					</Label>
					<Select
						value={currentLang}
						onValueChange={val => val && setLanguage(val)}
					>
						<SelectTrigger className="w-full">
							<SelectValue>{t(languages[currentLang])}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="en">
								<T k="language.name.en" />
							</SelectItem>
							<SelectItem value="de">
								<T k="language.name.de" />
							</SelectItem>
						</SelectContent>
					</Select>
					<TypographyMuted className="text-xs">
						<T k="settings.language.comingSoon" />
					</TypographyMuted>
				</div>
			</div>
		</SettingsSection>
	)
}
