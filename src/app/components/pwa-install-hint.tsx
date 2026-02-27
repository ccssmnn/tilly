import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "#shared/ui/button"
import { useIntl } from "#shared/intl/setup"
import { isMobileDevice, useIsPWAInstalled } from "#app/hooks/use-pwa"
import { useAppStore } from "#app/lib/store"
import { PWAInstallDialog } from "./pwa-install-dialog"

export { PWAInstallHint }

function PWAInstallHint() {
	let t = useIntl()
	let isPWAInstalled = useIsPWAInstalled()
	let pwaInstallHintDismissed = useAppStore(
		state => state.pwaInstallHintDismissed,
	)
	let setPWAInstallHintDismissed = useAppStore(
		state => state.setPWAInstallHintDismissed,
	)
	let [drawerOpen, setDrawerOpen] = useState(false)
	let [hintShown, setHintShown] = useState(false)

	let shouldShowHint =
		isMobileDevice() && !isPWAInstalled && !pwaInstallHintDismissed

	useEffect(() => {
		if (!shouldShowHint || hintShown) return

		let timeout = window.setTimeout(() => {
			setHintShown(true)
			let toastId = toast(
				<div className="flex flex-col gap-3">
					<div>
						<div className="font-medium">{t("install.title")}</div>
						<div className="text-muted-foreground text-sm">
							{t("pwa.install.dialog.description.mobile")}
						</div>
					</div>
					<div className="flex flex-row-reverse justify-start gap-2">
						<Button
							size="sm"
							onClick={() => {
								toast.dismiss(toastId)
								setDrawerOpen(true)
							}}
						>
							{t("nav.install")}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								toast.dismiss(toastId)
								setPWAInstallHintDismissed(true)
							}}
						>
							{t("pwa.install.dialog.later")}
						</Button>
					</div>
				</div>,
				{ duration: Infinity },
			)
		}, 2000)

		return () => window.clearTimeout(timeout)
	}, [hintShown, setPWAInstallHintDismissed, shouldShowHint, t])

	return (
		<PWAInstallDialog
			open={drawerOpen}
			onOpenChange={setDrawerOpen}
			onInstallComplete={() => {
				setDrawerOpen(false)
				setPWAInstallHintDismissed(true)
			}}
			onDismiss={() => setPWAInstallHintDismissed(true)}
		/>
	)
}
