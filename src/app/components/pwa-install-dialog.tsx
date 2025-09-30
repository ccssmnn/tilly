import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "#shared/ui/dialog"
import {
	useIsAndroid,
	useIsIOS,
	usePWAInstallPrompt,
	useIsMobileDevice,
} from "#app/hooks/use-pwa"
import { BoxArrowUp, Share } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"

export { PWAInstallDialog }
export type { PWAInstallDialogProps }

interface PWAInstallDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onInstallComplete?: () => void
	onDismiss?: () => void
}

function PWAInstallDialog({
	open,
	onOpenChange,
	onInstallComplete,
	onDismiss,
}: PWAInstallDialogProps) {
	let isAndroid = useIsAndroid()
	let isIOS = useIsIOS()
	let isMobileDevice = useIsMobileDevice()
	let { canInstall, promptInstall } = usePWAInstallPrompt()

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="pwa.install.dialog.title" />
						</DialogTitle>
						<DialogDescription>
							<T
								k={
									isMobileDevice
										? "pwa.install.dialog.description.mobile"
										: "pwa.install.dialog.description.desktop"
								}
							/>
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-4">
					{isAndroid && canInstall && (
						<AndroidChromeInstructions
							onInstall={promptInstall}
							onInstallComplete={onInstallComplete}
						/>
					)}
					{isAndroid && !canInstall && <AndroidManualInstructions />}
					{isIOS && <IOSInstructions />}
					{!isAndroid && !isIOS && isMobileDevice && <GenericInstructions />}
					{!isMobileDevice && (
						<DesktopInstructions
							canInstall={canInstall}
							onInstall={promptInstall}
							onInstallComplete={onInstallComplete}
						/>
					)}

					<div className="pt-2">
						<Button
							variant="secondary"
							onClick={() => {
								onOpenChange(false)
								onDismiss?.()
							}}
							className="w-full"
						>
							<T k="pwa.install.dialog.later" />
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function AndroidChromeInstructions({
	onInstall,
	onInstallComplete,
}: {
	onInstall: () => Promise<"accepted" | "dismissed" | null>
	onInstallComplete?: () => void
}) {
	let handleInstall = async () => {
		let result = await onInstall()
		if (result === "accepted" && onInstallComplete) {
			onInstallComplete()
		}
	}

	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-sm">
				<T k="pwa.install.dialog.browser.title" />
			</p>
			<Button onClick={handleInstall} className="w-full">
				<T k="pwa.install.dialog.install" />
			</Button>
		</div>
	)
}

function AndroidManualInstructions() {
	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-sm">
				<T k="pwa.install.android.title" />
			</p>
			<ol className="text-muted-foreground list-inside list-decimal space-y-2 pl-2 text-sm">
				<li>
					<T
						k="pwa.install.android.menuStep"
						components={{
							shareIcon: ({ children }) => (
								<>
									<Share className="inline h-4 w-4" /> {children}
								</>
							),
						}}
					/>
				</li>
				<li>
					<T k="pwa.install.android.step1" />
				</li>
				<li>
					<T k="pwa.install.android.step2" />
				</li>
			</ol>
		</div>
	)
}

function IOSInstructions() {
	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-sm">
				<T k="pwa.install.ios.title" />
			</p>
			<ol className="text-muted-foreground list-inside list-decimal space-y-2 pl-2 text-sm">
				<li>
					<T
						k="pwa.install.ios.shareStep"
						components={{
							shareIcon: ({ children }) => (
								<>
									<BoxArrowUp className="inline h-4 w-4" /> {children}
								</>
							),
						}}
					/>
				</li>
				<li>
					<T k="pwa.install.ios.step1" />
				</li>
				<li>
					<T k="pwa.install.ios.step2" />
				</li>
			</ol>
			<p className="text-muted-foreground bg-muted/50 rounded p-2 text-xs">
				<T k="pwa.install.ios.note" />
			</p>
		</div>
	)
}

function DesktopInstructions({
	canInstall,
	onInstall,
	onInstallComplete,
}: {
	canInstall: boolean
	onInstall: () => Promise<"accepted" | "dismissed" | null>
	onInstallComplete?: () => void
}) {
	let handleInstall = async () => {
		let result = await onInstall()
		if (result === "accepted" && onInstallComplete) {
			onInstallComplete()
		}
	}

	if (canInstall) {
		return (
			<div className="space-y-3">
				<p className="text-muted-foreground text-sm">
					<T k="pwa.install.desktop.browser.title" />
				</p>
				<Button onClick={handleInstall} className="w-full">
					<T k="pwa.install.dialog.install" />
				</Button>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-sm">
				<T k="pwa.install.desktop.title" />
			</p>
			<div className="space-y-3">
				<div>
					<p className="text-sm font-medium">
						<T k="pwa.install.desktop.chrome" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="pwa.install.desktop.chrome.instruction" />
					</p>
				</div>
				<div>
					<p className="text-sm font-medium">
						<T k="pwa.install.desktop.safari" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="pwa.install.desktop.safari.instruction" />
					</p>
				</div>
				<div>
					<p className="text-sm font-medium">
						<T k="pwa.install.desktop.firefox" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="pwa.install.desktop.firefox.instruction" />
					</p>
				</div>
			</div>
		</div>
	)
}

function GenericInstructions() {
	return (
		<div className="space-y-3">
			<p className="text-muted-foreground text-sm">
				<T k="pwa.install.generic.title" />
			</p>
			<ol className="text-muted-foreground list-inside list-decimal space-y-2 pl-2 text-sm">
				<li>
					<T k="pwa.install.generic.step1" />
				</li>
				<li>
					<T k="pwa.install.generic.step2" />
				</li>
			</ol>
		</div>
	)
}
