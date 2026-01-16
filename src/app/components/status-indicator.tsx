import { useState } from "react"
import {
	CloudSlash,
	ArrowClockwise,
	PersonX,
	Check,
	ExclamationTriangleFill,
} from "react-bootstrap-icons"
import { useAuth } from "@clerk/clerk-react"

import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
	DialogClose,
	DialogHeader,
} from "#shared/ui/dialog"
import { TypographyP } from "#shared/ui/typography"
import { usePWA } from "#app/lib/pwa"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { useIsMobile } from "#app/hooks/use-mobile"
import { T, useIntl } from "#shared/intl/setup"
import { getSignInUrl } from "#app/lib/auth-utils"
import { Alert, AlertTitle } from "#shared/ui/alert"

export { StatusIndicator }

function StatusIndicator() {
	let { needRefresh } = usePWA()
	let isOnline = useOnlineStatus()
	let { isLoaded, isSignedIn } = useAuth()

	if (!isOnline) {
		return <OfflineIndicator />
	}

	if (needRefresh) {
		return <UpdateIndicator />
	}

	if (isLoaded && !isSignedIn) {
		return <NotSignedInIndicator />
	}

	return null
}

function OfflineIndicator() {
	let t = useIntl()
	let isMobile = useIsMobile()

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					title={t("status.offline.tooltip")}
					variant="secondary"
					className="absolute top-3 right-3 md:gap-2"
					style={
						isMobile
							? {
									top: `max(calc(var(--spacing) * 3), env(safe-area-inset-top))`,
									right: `max(calc(var(--spacing) * 3), env(safe-area-inset-right))`,
								}
							: undefined
					}
				>
					<CloudSlash />
					<span className="hidden md:inline">
						<T k="status.offline.tooltip" />
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="status.offline.dialog.title" />
						</DialogTitle>
						<DialogDescription className="text-foreground leading-tight">
							<T k="status.offline.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-3">
					<Alert>
						<Check />
						<AlertTitle>
							<T k="status.offline.feature.core" />
						</AlertTitle>
					</Alert>
					<Alert>
						<ExclamationTriangleFill />
						<AlertTitle>
							<T k="status.offline.feature.requiresInternet" />
						</AlertTitle>
					</Alert>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function UpdateIndicator() {
	let t = useIntl()
	let isMobile = useIsMobile()
	let { updateServiceWorker } = usePWA()
	let [isApplyingUpdate, setIsApplyingUpdate] = useState(false)

	async function handleApplyUpdate() {
		setIsApplyingUpdate(true)
		await updateServiceWorker()
		window.location.reload()
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					title={t("status.update.tooltip")}
					className="absolute top-3 right-3 md:gap-2"
					style={
						isMobile
							? {
									top: `max(calc(var(--spacing) * 3), env(safe-area-inset-top))`,
									right: `max(calc(var(--spacing) * 3), env(safe-area-inset-right))`,
								}
							: undefined
					}
				>
					<ArrowClockwise />
					<span className="hidden md:inline">
						<T k="status.update.tooltip" />
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="status.update.dialog.title" />
						</DialogTitle>
						<DialogDescription className="text-foreground leading-tight">
							<T k="status.update.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-4">
					<div className="flex gap-2">
						<Button
							onClick={handleApplyUpdate}
							disabled={isApplyingUpdate}
							className="flex-1"
						>
							{isApplyingUpdate
								? t("status.update.updating")
								: t("status.update.updateNow")}
						</Button>
						<Button variant="outline" className="flex-1" asChild>
							<DialogClose>
								<T k="status.update.later" />
							</DialogClose>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function NotSignedInIndicator() {
	let t = useIntl()
	let isMobile = useIsMobile()

	function handleSignIn() {
		window.location.href = getSignInUrl(window.location.pathname)
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					title={t("status.notSignedIn.tooltip")}
					variant="warning"
					className="absolute top-3 right-3 md:gap-2"
					style={
						isMobile
							? {
									top: `max(calc(var(--spacing) * 3), env(safe-area-inset-top))`,
									right: `max(calc(var(--spacing) * 3), env(safe-area-inset-right))`,
								}
							: undefined
					}
				>
					<PersonX />
					<span className="hidden md:inline">
						<T k="status.notSignedIn.tooltip" />
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="status.notSignedIn.dialog.title" />
						</DialogTitle>
						<DialogDescription className="text-foreground leading-tight">
							<T k="status.notSignedIn.browserOnly" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-3">
					<TypographyP className="leading-none">
						<T k="status.notSignedIn.benefits" />
					</TypographyP>
					<DialogClose asChild>
						<Button onClick={handleSignIn} className="h-12 w-full">
							<T k="status.notSignedIn.signIn" />
						</Button>
					</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	)
}
