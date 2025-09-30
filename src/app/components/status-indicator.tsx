import { useState } from "react"
import { CloudSlash, ArrowClockwise } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "#shared/ui/dialog"
import { TypographyMuted } from "#shared/ui/typography"
import { useServiceWorkerUpdate } from "#app/hooks/use-service-worker-update"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { useIsMobile } from "#app/hooks/use-mobile"
import { T, useIntl } from "#shared/intl/setup"

export { StatusIndicator }

function StatusIndicator() {
	let t = useIntl()
	let { updateAvailable, applyUpdate } = useServiceWorkerUpdate()
	let isOnline = useOnlineStatus()
	let isMobile = useIsMobile()
	let [isApplyingUpdate, setIsApplyingUpdate] = useState(false)

	let showOfflineIndicator = !isOnline
	let showUpdateIndicator = updateAvailable

	let handleApplyUpdate = async () => {
		setIsApplyingUpdate(true)
		await applyUpdate()
	}

	if (showOfflineIndicator) {
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

	if (showUpdateIndicator) {
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

	return null
}
