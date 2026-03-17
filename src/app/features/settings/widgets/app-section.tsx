import { useState } from "react"
import { Button } from "#shared/ui/button"
import { T, useIntl } from "#shared/intl/setup"
import { toast } from "sonner"
import { SettingsSection } from "#app/components/settings-section"
import { usePWA } from "#app/lib/pwa"
import { mobileActionButtonClass, sectionStackClass } from "../lib/layout"

export { AppSection }

function AppSection() {
	let t = useIntl()
	let { checkForUpdates } = usePWA()
	let [isChecking, setIsChecking] = useState(false)

	async function handleCheckForUpdates() {
		setIsChecking(true)
		await checkForUpdates()
		setIsChecking(false)
		toast.info(t("settings.app.checkedForUpdates"))
	}

	return (
		<SettingsSection
			title={t("settings.app.title")}
			description={t("settings.app.description")}
		>
			<div className={sectionStackClass}>
				<div>
					<Button
						variant="outline"
						className={mobileActionButtonClass}
						onClick={handleCheckForUpdates}
						disabled={isChecking}
					>
						{isChecking ? (
							<T k="settings.app.checking" />
						) : (
							<T k="settings.app.checkForUpdates" />
						)}
					</Button>
				</div>
			</div>
		</SettingsSection>
	)
}
