import { useEffect, useRef, useState } from "react"
import {
	CloudSlash,
	Check,
	ExclamationTriangleFill,
} from "react-bootstrap-icons"
import { useAuth, SignInButton } from "@clerk/clerk-react"
import { toast } from "sonner"

import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
	DialogHeader,
} from "#shared/ui/dialog"
import { usePWA } from "#app/lib/pwa"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { useIsMobile } from "#app/hooks/use-mobile"
import { T, useIntl } from "#shared/intl/setup"
import { Alert, AlertTitle } from "#shared/ui/alert"

export { StatusIndicator }

const UPDATE_TOAST_ID = "status-update-available"
const SIGNED_OUT_TOAST_ID = "status-signed-out"
const SIGNED_OUT_DISMISSED_KEY = "status.signedOut.dismissed"

function StatusIndicator() {
	let { needRefresh } = usePWA()
	let isOnline = useOnlineStatus()
	let { isLoaded, isSignedIn } = useAuth()

	if (!isOnline) {
		return <OfflineIndicator />
	}

	if (needRefresh) {
		return <UpdateToastIndicator />
	}

	if (isLoaded && !isSignedIn) {
		return <NotSignedInToastIndicator />
	}

	return null
}

function OfflineIndicator() {
	let t = useIntl()
	let isMobile = useIsMobile()

	return (
		<Dialog>
			<DialogTrigger
				nativeButton
				render={htmlProps => (
					<Button
						{...htmlProps}
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
				)}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<T k="status.offline.dialog.title" />
					</DialogTitle>
					<DialogDescription className="text-foreground leading-tight">
						<T k="status.offline.description" />
					</DialogDescription>
				</DialogHeader>
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

function UpdateToastIndicator() {
	let t = useIntl()
	let { needRefresh, updateServiceWorker } = usePWA()
	let dismissedRef = useRef(false)
	let [isApplyingUpdate, setIsApplyingUpdate] = useState(false)

	useEffect(() => {
		if (!needRefresh) {
			dismissedRef.current = false
			toast.dismiss(UPDATE_TOAST_ID)
			return
		}

		if (dismissedRef.current) return

		toast(
			<div className="flex flex-col gap-3">
				<div>
					<div className="font-medium">{t("status.update.title")}</div>
					<div className="text-muted-foreground text-sm">
						{t("status.update.description")}
					</div>
				</div>
				<div className="flex flex-row-reverse justify-start gap-2">
					<Button
						size="sm"
						onClick={async () => {
							setIsApplyingUpdate(true)
							try {
								await updateServiceWorker()
								window.location.reload()
							} finally {
								setIsApplyingUpdate(false)
							}
						}}
						disabled={isApplyingUpdate}
					>
						{isApplyingUpdate
							? t("status.update.updating")
							: t("status.update.updateNow")}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							dismissedRef.current = true
							toast.dismiss(UPDATE_TOAST_ID)
						}}
					>
						{t("status.update.later")}
					</Button>
				</div>
			</div>,
			{
				id: UPDATE_TOAST_ID,
				duration: Infinity,
				onDismiss: () => {
					dismissedRef.current = true
				},
			},
		)

		return () => {
			toast.dismiss(UPDATE_TOAST_ID)
		}
	}, [isApplyingUpdate, needRefresh, t, updateServiceWorker])

	return null
}

function NotSignedInToastIndicator() {
	let t = useIntl()
	let skipPersistOnDismissRef = useRef(false)
	let [isDismissed, setIsDismissed] = useState(() => {
		if (typeof window === "undefined") return false
		return sessionStorage.getItem(SIGNED_OUT_DISMISSED_KEY) === "1"
	})

	function dismissToastWithoutPersist() {
		skipPersistOnDismissRef.current = true
		toast.dismiss(SIGNED_OUT_TOAST_ID)
	}

	useEffect(() => {
		if (isDismissed) {
			dismissToastWithoutPersist()
			return
		}

		toast(
			<div className="flex flex-col gap-3">
				<div>
					<div className="font-medium">
						{t("status.notSignedIn.dialog.title")}
					</div>
					<div className="text-muted-foreground text-sm">
						{t("status.notSignedIn.browserOnly")}
					</div>
				</div>
				<div className="flex flex-row-reverse justify-start gap-2">
					<SignInButton mode="redirect">
						<Button
							size="sm"
							onClick={() => {
								dismissToastWithoutPersist()
							}}
						>
							{t("status.notSignedIn.signIn")}
						</Button>
					</SignInButton>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							sessionStorage.setItem(SIGNED_OUT_DISMISSED_KEY, "1")
							setIsDismissed(true)
							dismissToastWithoutPersist()
						}}
					>
						{t("status.notSignedIn.dismiss")}
					</Button>
				</div>
			</div>,
			{
				id: SIGNED_OUT_TOAST_ID,
				duration: Infinity,
				onDismiss: () => {
					if (skipPersistOnDismissRef.current) {
						skipPersistOnDismissRef.current = false
						return
					}
					sessionStorage.setItem(SIGNED_OUT_DISMISSED_KEY, "1")
					setIsDismissed(true)
				},
			},
		)

		return () => {
			dismissToastWithoutPersist()
		}
	}, [isDismissed, t])

	return null
}
