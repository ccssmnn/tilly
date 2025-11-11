import { createLink, useLocation } from "@tanstack/react-router"
import { useState } from "react"
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
import { useIsPWAInstalled, useIsMobileDevice } from "#app/hooks/use-pwa"
import { useAppStore } from "#app/lib/store"
import { PWAInstallDialog } from "./pwa-install-dialog"
import { T } from "#shared/intl/setup"

export { Navigation }

function Navigation({ dueReminderCount }: { dueReminderCount: number }) {
	let location = useLocation()
	let [showPWADialog, setShowPWADialog] = useState(false)
	let isInputFocused = useInputFocusState()
	let isPWAInstalled = useIsPWAInstalled()
	let isMobileDevice = useIsMobileDevice()

	let peopleIcon = useIconTapAnimation()
	let notesIcon = useIconTapAnimation()
	let remindersIcon = useIconTapAnimation()
	let assistantIcon = useIconTapAnimation()
	let settingsIcon = useIconTapAnimation()
	let installIcon = useIconTapAnimation()

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
	let activeProps = { className: "text-foreground" }
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
					<MotionLink
						key="/people"
						to="/people"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("/people")}
						{...peopleIcon.handlers}
					>
						{({ isActive }) => (
							<>
								<motion.div animate={peopleIcon.controls}>
									{isActive ? (
										<PeopleFill className="size-6 sm:mb-1 md:mb-0" />
									) : (
										<People className="size-6 sm:mb-1 md:mb-0" />
									)}
								</motion.div>
								<span className="sr-only sm:not-sr-only">
									<T k="nav.people" />
								</span>
							</>
						)}
					</MotionLink>
					<MotionLink
						key="/notes"
						to="/notes"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("/notes")}
						{...notesIcon.handlers}
					>
						{({ isActive }) => (
							<>
								<motion.div animate={notesIcon.controls}>
									{isActive ? (
										<FileEarmarkTextFill className="size-6 sm:mb-1 md:mb-0" />
									) : (
										<FileEarmarkText className="size-6 sm:mb-1 md:mb-0" />
									)}
								</motion.div>
								<span className="sr-only sm:not-sr-only">
									<T k="nav.notes" />
								</span>
							</>
						)}
					</MotionLink>
					<MotionLink
						key="/reminders"
						to="/reminders"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("/reminders")}
						{...remindersIcon.handlers}
					>
						{({ isActive }) => (
							<>
								<div className="relative">
									<motion.div animate={remindersIcon.controls}>
										{isActive ? (
											<BellFill className="size-6 sm:mb-1 md:mb-0" />
										) : (
											<Bell className="size-6 sm:mb-1 md:mb-0" />
										)}
									</motion.div>
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
								<span className="sr-only sm:not-sr-only">
									<T k="nav.reminders" />
								</span>
							</>
						)}
					</MotionLink>
					<MotionLink
						key="/assistant"
						to="/assistant"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("/assistant")}
						{...assistantIcon.handlers}
					>
						{({ isActive }) => (
							<>
								<motion.div animate={assistantIcon.controls}>
									{isActive ? (
										<ChatFill className="size-6 sm:mb-1 md:mb-0" />
									) : (
										<Chat className="size-6 sm:mb-1 md:mb-0" />
									)}
								</motion.div>
								<span className="sr-only sm:not-sr-only">
									<T k="nav.assistant" />
								</span>
							</>
						)}
					</MotionLink>
					<MotionLink
						key="/settings"
						to="/settings"
						activeProps={activeProps}
						inactiveProps={inactiveProps}
						className={linkClassName}
						onClick={() => handleNavClick("/settings")}
						{...settingsIcon.handlers}
					>
						{({ isActive }) => (
							<>
								<motion.div animate={settingsIcon.controls}>
									{isActive ? (
										<GearFill className="size-6 sm:mb-1 md:mb-0" />
									) : (
										<Gear className="size-6 sm:mb-1 md:mb-0" />
									)}
								</motion.div>
								<span className="sr-only sm:not-sr-only">
									<T k="nav.settings" />
								</span>
							</>
						)}
					</MotionLink>
					{shouldShowPWAButton && (
						<motion.button
							className={cn(
								linkClassName,
								shouldPulse
									? "text-primary hover:text-primary/80 md:hover:bg-primary/10 transition-color"
									: "text-muted-foreground hover:text-foreground/80 md:hover:bg-muted/50 transition-color",
							)}
							onClick={handlePWAInstallClick}
							{...installIcon.handlers}
						>
							<motion.div animate={installIcon.controls}>
								<AppIndicator
									className={cn(
										"size-6 sm:mb-1 md:mb-0",
										shouldPulse && "animate-pulse",
									)}
								/>
							</motion.div>
							<span className="sr-only sm:not-sr-only">
								<T k="nav.install" />
							</span>
						</motion.button>
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

function useIconTapAnimation() {
	let controls = useAnimationControls()

	function handleTapStart() {
		controls.stop()
		void controls.start(tapAnimations.press)
	}

	function handleTapEnd() {
		controls.stop()
		void controls.start(tapAnimations.release)
	}

	return {
		controls,
		handlers: {
			onTapStart: handleTapStart,
			onTap: handleTapEnd,
			onTapCancel: handleTapEnd,
		},
	}
}
