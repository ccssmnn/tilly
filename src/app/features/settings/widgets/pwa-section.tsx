import { useState } from "react"
import { Button } from "#shared/ui/button"
import { T, useIntl } from "#shared/intl/setup"
import { SettingsSection } from "#app/components/settings-section"
import { isMobileDevice, useIsPWAInstalled } from "#app/hooks/use-pwa"
import { PWAInstallDialog } from "#app/components/pwa-install-dialog"
import { mobileActionButtonClass, sectionStackClass } from "../lib/layout"

export { PWASection }

function PWASection() {
	let t = useIntl()
	let isPWAInstalled = useIsPWAInstalled()
	let [showInstallDialog, setShowInstallDialog] = useState(false)

	if (isPWAInstalled) {
		return null
	}

	return (
		<>
			<SettingsSection
				title={t("settings.pwa.title")}
				description={
					isMobileDevice()
						? t("settings.pwa.description.mobile")
						: t("settings.pwa.description.desktop")
				}
			>
				<div className={sectionStackClass}>
					<div>
						<Button
							className={mobileActionButtonClass}
							onClick={() => setShowInstallDialog(true)}
						>
							<T k="settings.pwa.install.button" />
						</Button>
						<p className="text-muted-foreground mt-2 text-xs">
							{isMobileDevice() ? (
								<T k="settings.pwa.install.description.mobile" />
							) : (
								<T k="settings.pwa.install.description.desktop" />
							)}
						</p>
					</div>
				</div>
			</SettingsSection>
			<PWAInstallDialog
				open={showInstallDialog}
				onOpenChange={setShowInstallDialog}
				onInstallComplete={() => setShowInstallDialog(false)}
			/>
		</>
	)
}
