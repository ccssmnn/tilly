import { createLink, useLocation } from "@tanstack/react-router"
import { useState } from "react"
import type { ComponentType, ReactNode } from "react"
import { motion, useAnimationControls } from "motion/react"
import type { AnimationDefinition } from "motion/react"
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
	FileEarmarkText,
	FileEarmarkTextFill,
} from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { useInputFocusState } from "#app/hooks/use-input-focus-state"
import { isMobileDevice, useIsPWAInstalled } from "#app/hooks/use-pwa"
import { useAppStore } from "#app/lib/store"
import { PWAInstallDialog } from "./pwa-install-dialog"
import { T } from "#shared/intl/setup"

export { Navigation }

function Navigation({ dueReminderCount }: { dueReminderCount: number }) {
	let location = useLocation()
	let [showPWADialog, setShowPWADialog] = useState(false)
	let isInputFocused = useInputFocusState()
	let isPWAInstalled = useIsPWAInstalled()

	let pwaInstallHintDismissed = useAppStore(
		state => state.pwaInstallHintDismissed,
	)
	let setPWAInstallHintDismissed = useAppStore(
		state => state.setPWAInstallHintDismissed,
	)
	let hideInstallNavItem = useAppStore(state => state.hideInstallNavItem)
	let setHideInstallNavItem = useAppStore(state => state.setHideInstallNavItem)

	let shouldShowPWAButton =
		isMobileDevice() && !isPWAInstalled && !hideInstallNavItem
	let shouldPulse = shouldShowPWAButton && !pwaInstallHintDismissed

	function handleNavClick(routePath: string) {
		if (location.pathname.endsWith(routePath)) {
			window.scrollTo({ top: 0, behavior: "smooth" })
		}
	}

	function handlePWAInstallClick() {
		setShowPWADialog(true)
	}

	function handlePWAInstallComplete() {
		setShowPWADialog(false)
		setPWAInstallHintDismissed(true)
	}

	function handlePWADialogClose(open: boolean) {
		setShowPWADialog(open)
	}
	return (
		<>
			<nav
				className={cn(
					"bg-background/50 border-border fixed inset-x-3 z-1 transform rounded-4xl border shadow-lg backdrop-blur-xl duration-300",
					"md:top-4 md:bottom-auto md:left-1/2 md:w-fit md:-translate-x-1/2",
					isInputFocused
						? "bottom-0 max-md:translate-y-full max-md:opacity-0"
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
					<NavBarButton
						key="/people"
						to="/people"
						label={<T k="nav.people" />}
						onClick={() => handleNavClick("/people")}
						activeIcon={PeopleFill}
						inactiveIcon={People}
					/>
					<NavBarButton
						key="/notes"
						to="/notes"
						label={<T k="nav.notes" />}
						onClick={() => handleNavClick("/notes")}
						activeIcon={FileEarmarkTextFill}
						inactiveIcon={FileEarmarkText}
					/>
					<NavBarButton
						key="/reminders"
						to="/reminders"
						label={<T k="nav.reminders" />}
						onClick={() => handleNavClick("/reminders")}
						activeIcon={BellFill}
						inactiveIcon={Bell}
						badgeContent={
							dueReminderCount > 0 ? (
								dueReminderCount > 9 ? (
									<T k="nav.notifications.count.max" />
								) : (
									dueReminderCount
								)
							) : null
						}
					/>
					<NavBarButton
						key="/assistant"
						to="/assistant"
						label={<T k="nav.assistant" />}
						onClick={() => handleNavClick("/assistant")}
						activeIcon={ChatFill}
						inactiveIcon={Chat}
					/>
					<NavBarButton
						key="/settings"
						to="/settings"
						label={<T k="nav.settings" />}
						onClick={() => handleNavClick("/settings")}
						activeIcon={GearFill}
						inactiveIcon={Gear}
					/>
					{shouldShowPWAButton && (
						<NavBarButton
							label={<T k="nav.install" />}
							className={
								shouldPulse
									? "text-primary hover:text-primary/80 md:hover:bg-primary/10 transition-color"
									: "text-muted-foreground hover:text-foreground/80 md:hover:bg-muted/50 transition-color"
							}
							onClick={handlePWAInstallClick}
							inactiveIcon={AppIndicator}
							activeIcon={AppIndicator}
							iconClassName={shouldPulse ? "animate-pulse" : undefined}
						/>
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

type NavIconComponent = ComponentType<{ className?: string }>

type NavBarButtonProps = {
	to?: Parameters<typeof MotionLink>[0]["to"]
	onClick?: () => void
	className?: string
	label: ReactNode
	activeIcon?: NavIconComponent
	inactiveIcon: NavIconComponent
	badgeContent?: ReactNode
	iconClassName?: string
}

let MotionLink = createLink(motion.a)

let tapAnimations: Record<"press" | "release", AnimationDefinition> = {
	press: {
		scale: 0.8,
		rotate: -3,
		transition: { duration: 0.12, ease: "easeOut" },
	},
	release: {
		scale: [0.8, 1.2, 1],
		rotate: [-3, 3, 0],
		transition: {
			duration: 0.32,
			times: [0, 0.5, 1],
			ease: ["easeOut", "easeInOut"],
		},
	},
}

function NavBarButton({
	to,
	onClick,
	className,
	label,
	activeIcon,
	inactiveIcon,
	badgeContent,
	iconClassName,
}: NavBarButtonProps) {
	let controls = useAnimationControls()
	let buttonClassName = cn(
		"transition-colors flex h-full flex-1 flex-col items-center justify-center text-xs",
		"md:rounded-md md:flex-row md:gap-2 md:px-3 md:py-2 md:text-sm md:flex-none",
		className,
	)
	let iconClasses = cn("size-6 sm:mb-1 md:mb-0", iconClassName)

	function handleTapStart() {
		controls.stop()
		void controls.start(tapAnimations.press)
	}

	function handleTapEnd() {
		controls.stop()
		void controls.start(tapAnimations.release)
	}

	function renderContent(isActive: boolean) {
		let IconComponent = isActive ? (activeIcon ?? inactiveIcon) : inactiveIcon
		let hasBadge = badgeContent !== null && badgeContent !== undefined
		return (
			<>
				<div className={cn(hasBadge && "relative")}>
					<motion.div animate={controls}>
						<IconComponent className={iconClasses} />
					</motion.div>
					{hasBadge ? (
						<span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 min-w-5 rounded-full px-1 py-0.5 text-center text-xs font-bold">
							{badgeContent}
						</span>
					) : null}
				</div>
				<span className="sr-only sm:not-sr-only">{label}</span>
			</>
		)
	}

	let sharedProps = {
		className: buttonClassName,
		onClick,
		onTapStart: handleTapStart,
		onTap: handleTapEnd,
		onTapCancel: handleTapEnd,
	}

	if (to) {
		return (
			<MotionLink
				to={to}
				activeProps={{ className: "text-foreground" }}
				inactiveProps={{
					className:
						"text-muted-foreground hover:text-foreground/80 md:hover:bg-muted/50 transition-color",
				}}
				{...sharedProps}
			>
				{({ isActive }: { isActive: boolean }) => renderContent(isActive)}
			</MotionLink>
		)
	}

	return (
		<motion.button type="button" {...sharedProps}>
			{renderContent(false)}
		</motion.button>
	)
}
