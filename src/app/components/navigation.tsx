import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import {
	People,
	PeopleFill,
	Bell,
	BellFill,
	Chat,
	ChatFill,
	Gear,
	GearFill,
	AppIndicator,
} from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { useInputFocusState } from "#app/hooks/use-input-focus-state"
import { useIsPWAInstalled, useIsMobileDevice } from "#app/hooks/use-pwa"
import { useAppStore } from "#app/lib/store"
import { PWAInstallDialog } from "./pwa-install-dialog"
import { T } from "#shared/intl/setup"

export { Navigation }

function Navigation({ dueReminderCount }: { dueReminderCount: number }) {
	let location = useLocation()
	let { animatingIcon, triggerAnimation } = useIconAnimation()
	let [showPWADialog, setShowPWADialog] = useState(false)
	let isInputFocused = useInputFocusState()
	let isPWAInstalled = useIsPWAInstalled()
	let isMobileDevice = useIsMobileDevice()

	let pwaInstallHintDismissed = useAppStore(
		state => state.pwaInstallHintDismissed,
	)
	let setPWAInstallHintDismissed = useAppStore(
		state => state.setPWAInstallHintDismissed,
	)
	let hideInstallNavItem = useAppStore(state => state.hideInstallNavItem)
	let setHideInstallNavItem = useAppStore(state => state.setHideInstallNavItem)

	let shouldShowPWAButton =
		isMobileDevice && !isPWAInstalled && !hideInstallNavItem
	let shouldPulse = shouldShowPWAButton && !pwaInstallHintDismissed

	function handleNavClick(iconKey: string, routePath: string) {
		triggerAnimation(iconKey)
		if (location.pathname.endsWith(routePath)) {
			window.scrollTo({ top: 0, behavior: "smooth" })
		}
	}

	function handlePWAInstallClick() {
		setShowPWADialog(true)
		triggerAnimation("pwa-install")
	}

	function handlePWAInstallComplete() {
		setShowPWADialog(false)
		setPWAInstallHintDismissed(true)
	}

	function handlePWADialogClose(open: boolean) {
		setShowPWADialog(open)
	}
	let activeProps = {
		className: "text-foreground",
	}
	let inactiveProps = {
		className:
			"text-muted-foreground hover:text-foreground/80 md:hover:bg-muted/50 transition-color",
	}
	let linkClassName = cn(
		"transition-colors flex h-full flex-1 flex-col items-center justify-center text-xs",
		"md:rounded-md md:flex-row md:gap-2 md:px-3 md:py-2 md:text-sm md:flex-none",
	)
	return (
		<>
			<nav
				className={cn(
					"bg-background/50 border-border absolute inset-x-3 z-1 transform rounded-4xl border shadow-lg backdrop-blur-xl duration-300",
					"md:top-4 md:bottom-auto md:left-1/2 md:w-fit md:-translate-x-1/2",
					isInputFocused
						? "bottom-0 max-md:translate-y-[100%] max-md:opacity-0"
						: "bottom-[max(calc(var(--spacing)*3),calc(env(safe-area-inset-bottom)-var(--spacing)*4))]",
				)}
			>
				<div
					className={cn(
						"flex items-center",
						"h-16 justify-around md:justify-center",
						"md:h-12 md:gap-1 md:p-1",
					)}
				>
					<Link
						key="/people"
						to="/people"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("people", "/people")}
					>
						{({ isActive }) => (
							<>
								{isActive ? (
									<PeopleFill
										className={cn(
											"mb-1 size-6 md:mb-0",
											animatingIcon === "people" && "animate-pulse-scale",
										)}
									/>
								) : (
									<People className="mb-1 size-6 md:mb-0" />
								)}
								<span>
									<T k="nav.people" />
								</span>
							</>
						)}
					</Link>
					<Link
						key="/reminders"
						to="/reminders"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("reminders", "/reminders")}
					>
						{({ isActive }) => (
							<>
								<div className="relative">
									{isActive ? (
										<BellFill
											className={cn(
												"mb-1 size-6 md:mb-0",
												animatingIcon === "reminders" && "animate-pulse-scale",
											)}
										/>
									) : (
										<Bell className="mb-1 size-6 md:mb-0" />
									)}
									{dueReminderCount > 0 ? (
										<span
											className={cn(
												"bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 min-w-[20px] rounded-full px-1 py-0.5 text-center text-xs font-bold",
											)}
										>
											{dueReminderCount > 9 ? (
												<T k="nav.notifications.count.max" />
											) : (
												dueReminderCount
											)}
										</span>
									) : null}
								</div>
								<span>
									<T k="nav.reminders" />
								</span>
							</>
						)}
					</Link>
					<Link
						key="/assistant"
						to="/assistant"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("assistant", "/assistant")}
					>
						{({ isActive }) => (
							<>
								{isActive ? (
									<ChatFill
										className={cn(
											"mb-1 size-6 md:mb-0",
											animatingIcon === "assistant" && "animate-pulse-scale",
										)}
									/>
								) : (
									<Chat className="mb-1 size-6 md:mb-0" />
								)}
								<span>
									<T k="nav.assistant" />
								</span>
							</>
						)}
					</Link>
					<Link
						key="/settings"
						to="/settings"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("settings", "/settings")}
					>
						{({ isActive }) => (
							<>
								{isActive ? (
									<GearFill
										className={cn(
											"mb-1 size-6 md:mb-0",
											animatingIcon === "settings" && "animate-pulse-scale",
										)}
									/>
								) : (
									<Gear className="mb-1 size-6 md:mb-0" />
								)}
								<span>
									<T k="nav.settings" />
								</span>
							</>
						)}
					</Link>
					{shouldShowPWAButton && (
						<button
							className={cn(
								linkClassName,
								shouldPulse
									? "text-primary hover:text-primary/80 md:hover:bg-primary/10 transition-color"
									: "text-muted-foreground hover:text-foreground/80 md:hover:bg-muted/50 transition-color",
								"plausible--event-name=Install+Click+Navigation",
							)}
							onClick={handlePWAInstallClick}
						>
							<AppIndicator
								className={cn(
									"mb-1 size-6 md:mb-0",
									shouldPulse && "animate-pulse",
									animatingIcon === "pwa-install" && "animate-pulse-scale",
								)}
							/>
							<span>
								<T k="nav.install" />
							</span>
						</button>
					)}
				</div>
			</nav>
			<PWAInstallDialog
				open={showPWADialog}
				onOpenChange={handlePWADialogClose}
				onInstallComplete={handlePWAInstallComplete}
				onDismiss={() => setHideInstallNavItem(true)}
			/>
		</>
	)
}

function useIconAnimation() {
	let [animatingIcon, setAnimatingIcon] = useState<string | null>(null)
	let timeoutRef = useRef<number | null>(null)

	function triggerAnimation(key: string) {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		setAnimatingIcon(key)
		timeoutRef.current = window.setTimeout(() => {
			setAnimatingIcon(null)
			timeoutRef.current = null
		}, 500)
	}

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
		}
	}, [])

	return { animatingIcon, triggerAnimation }
}
