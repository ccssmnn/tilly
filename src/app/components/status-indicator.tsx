import { useState } from "react"
import { CloudSlash, ArrowClockwise, PersonX } from "react-bootstrap-icons"
import { useUser } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
	DialogClose,
	DialogDescription,
	DialogHeader,
} from "#shared/ui/dialog"
import { TypographyMuted } from "#shared/ui/typography"
import { useServiceWorkerUpdate } from "#app/hooks/use-service-worker-update"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { useIsMobile } from "#app/hooks/use-mobile"
import { T, useIntl } from "#shared/intl/setup"

export { StatusIndicator }

function StatusIndicator() {
	let { updateAvailable } = useServiceWorkerUpdate()
	let isOnline = useOnlineStatus()
	let { user } = useUser()

	if (!isOnline) {
		return <OfflineIndicator />
	}

	if (updateAvailable) {
		return <UpdateIndicator />
	}

	if (!user) {
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
					size="icon"
					title={t("status.offline.tooltip")}
					variant="secondary"
					className="absolute top-3 right-3"
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
				</Button>
			</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogTitle>
						<T k="status.offline.dialog.title" />
					</DialogTitle>
				}
			>
				<div className="space-y-4">
					<TypographyMuted>
						<T k="status.offline.description" />
					</TypographyMuted>
					<ul className="space-y-1">
						<TypographyMuted className="text-xs">
							<T k="status.offline.feature.people" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.offline.feature.notes" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.offline.feature.history" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.offline.feature.chat.disabled" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.offline.feature.sync.disabled" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.offline.feature.notifications.disabled" />
						</TypographyMuted>
					</ul>
					<TypographyMuted className="text-xs">
						<T k="status.offline.sync.message" />
					</TypographyMuted>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function UpdateIndicator() {
	let t = useIntl()
	let isMobile = useIsMobile()
	let { applyUpdate } = useServiceWorkerUpdate()
	let [isApplyingUpdate, setIsApplyingUpdate] = useState(false)

	let handleApplyUpdate = async () => {
		setIsApplyingUpdate(true)
		await applyUpdate()
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon"
					title={t("status.update.tooltip")}
					className="absolute top-3 right-3"
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
				</Button>
			</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogTitle>
						<T k="status.update.dialog.title" />
					</DialogTitle>
				}
			>
				<div className="space-y-4">
					<TypographyMuted>
						<T k="status.update.description" />
					</TypographyMuted>
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

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon"
					title={t("status.notSignedIn.tooltip")}
					variant="warning"
					className="absolute top-3 right-3"
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
				</Button>
			</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="status.notSignedIn.dialog.title" />
						</DialogTitle>
						<DialogDescription>
							<TypographyMuted>
								<T k="status.notSignedIn.description" />
							</TypographyMuted>
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-4">
					<TypographyMuted className="text-xs">
						<T k="status.notSignedIn.warning" />
					</TypographyMuted>
					<ul className="space-y-1">
						<TypographyMuted className="text-xs">
							<T k="status.notSignedIn.feature.local" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.notSignedIn.feature.agent.disabled" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.notSignedIn.feature.sync.disabled" />
						</TypographyMuted>
						<TypographyMuted className="text-xs">
							<T k="status.notSignedIn.feature.notifications.disabled" />
						</TypographyMuted>
					</ul>
					<TypographyMuted>
						<T k="status.notSignedIn.benefits" />
					</TypographyMuted>
					<Button asChild className="w-full">
						<Link to="/settings">
							<T k="status.notSignedIn.signIn" />
						</Link>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
