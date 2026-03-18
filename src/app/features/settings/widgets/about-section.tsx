import { T, useIntl } from "#shared/intl/setup"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Compass01Icon,
	Book01Icon,
	Shield01Icon,
	Github01Icon,
} from "@hugeicons/core-free-icons"
import { SettingsSection } from "#app/features/settings/parts/settings-section"
import { sectionStackClass } from "../lib/layout"
import type { SettingsAccount } from "../lib/data"

export { AboutSection }

function AboutSection({ me }: { me: SettingsAccount }) {
	let t = useIntl()
	let currentLang = me.root.language || "en"

	return (
		<SettingsSection
			title={t("settings.about.title")}
			description={t("settings.about.description")}
		>
			<nav className={sectionStackClass}>
				<a
					href="/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
				>
					<HugeiconsIcon icon={Compass01Icon} className="size-5 shrink-0" />
					<T k="settings.about.website" />
				</a>
				<a
					href={`/${currentLang}/blog/pragmatic-relationship-journaling`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
				>
					<HugeiconsIcon icon={Book01Icon} className="size-5 shrink-0" />
					<T k="settings.about.blog" />
				</a>
				<a
					href={`/${currentLang}/privacy`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
				>
					<HugeiconsIcon icon={Shield01Icon} className="size-5 shrink-0" />
					<T k="settings.about.privacy" />
				</a>
				<a
					href="https://github.com/anomalyco/tilly"
					target="_blank"
					rel="noopener noreferrer"
					className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
				>
					<HugeiconsIcon icon={Github01Icon} className="size-5 shrink-0" />
					<T k="settings.about.github" />
				</a>
			</nav>
		</SettingsSection>
	)
}
