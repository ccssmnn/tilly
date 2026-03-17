import { Link } from "@tanstack/react-router"
import { Button } from "#shared/ui/button"
import { T, useIntl } from "#shared/intl/setup"
import { HugeiconsIcon } from "@hugeicons/react"
import { BulbIcon, Book01Icon, Compass01Icon } from "@hugeicons/core-free-icons"
import { SettingsSection } from "#app/components/settings-section"
import { useAppStore } from "#app/lib/store"
import type { SettingsAccount } from "../lib/data"

export { AboutSection }

function AboutSection({ me }: { me: SettingsAccount }) {
	let t = useIntl()
	let setTourSkipped = useAppStore(s => s.setTourSkipped)
	let currentLang = me.root.language || "en"

	return (
		<SettingsSection
			title={t("settings.about.title")}
			description={t("settings.about.description")}
		>
			<div className="space-y-3">
				<Button
					nativeButton={false}
					variant="outline"
					className="w-full justify-start"
					render={<a href="/" target="_blank" rel="noopener noreferrer" />}
				>
					<HugeiconsIcon icon={Compass01Icon} />
					<T k="settings.about.visit" />
				</Button>
				<Button
					nativeButton={false}
					variant="outline"
					className="w-full justify-start"
					render={
						<a
							href={`/${currentLang}/blog/pragmatic-relationship-journaling`}
							target="_blank"
							rel="noopener noreferrer"
						/>
					}
				>
					<HugeiconsIcon icon={Book01Icon} />
					<T k="settings.about.learnMore" />
				</Button>
				<Button
					nativeButton={false}
					variant="outline"
					className="w-full justify-start"
					render={<Link to="/tour" onClick={() => setTourSkipped(false)} />}
				>
					<HugeiconsIcon icon={BulbIcon} />
					<T k="settings.about.redoTour" />
				</Button>
			</div>
		</SettingsSection>
	)
}
