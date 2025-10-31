import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { Button } from "#shared/ui/button"
import { NewPerson } from "#app/features/new-person"
import { NewNote } from "#app/features/new-note"
import { NewReminder } from "#app/features/new-reminder"
import { useAppStore } from "#app/lib/store"
import { motion, AnimatePresence } from "motion/react"
import { useIsAndroid, useIsIOS, useIsPWAInstalled } from "#app/hooks/use-pwa"
import {
	TypographyH1,
	TypographyH2,
	TypographyLead,
} from "#shared/ui/typography"
import { T } from "#shared/intl"
import {
	PersonPlusFill,
	PlusCircleFill,
	BellFill,
	CheckCircleFill,
	ChevronLeft,
	ChevronRight,
	SkipForwardFill,
} from "react-bootstrap-icons"
import { InstallationInstructions } from "#app/components/pwa-install-dialog"

export const Route = createFileRoute("/tour")({
	component: TourComponent,
})

function TourComponent() {
	let setTourSkipped = useAppStore(s => s.setTourSkipped)
	let [currentStep, setCurrentStep] = useState(0)

	let isAndroid = useIsAndroid()
	let isIOS = useIsIOS()
	let isPWAInstalled = useIsPWAInstalled()

	let showPWAInstallStep = (isAndroid || isIOS) && !isPWAInstalled
	let steps = showPWAInstallStep
		? ([
				"welcome",
				"install-pwa",
				"add-person",
				"add-note",
				"add-reminder",
				"finish-setup",
			] as const)
		: ([
				"welcome",
				"add-person",
				"add-note",
				"add-reminder",
				"finish-setup",
			] as const)

	function getStepComponent(stepId: (typeof steps)[number]) {
		switch (stepId) {
			case "welcome":
				return <WelcomeStep />
			case "install-pwa":
				return <InstallPWAStep onSuccess={() => setCurrentStep(s => s + 1)} />
			case "add-person":
				return <AddPersonStep onSuccess={() => setCurrentStep(s => s + 1)} />
			case "add-note":
				return <AddNoteStep onSuccess={() => setCurrentStep(s => s + 1)} />
			case "add-reminder":
				return <AddReminderStep onSuccess={() => setCurrentStep(s => s + 1)} />
			case "finish-setup":
				return <FinishSetupStep />
			default:
				return null
		}
	}

	let [direction, setDirection] = useState(1)

	function nextStep() {
		setDirection(1)
		setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
	}

	function prevStep() {
		setDirection(-1)
		setCurrentStep(Math.max(currentStep - 1, 0))
	}

	return (
		<div
			className="absolute inset-0"
			style={{
				paddingTop: "max(1.5rem, env(safe-area-inset-top))",
				paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
				paddingRight: "max(0.75rem, env(safe-area-inset-right))",
				paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
			}}
		>
			<div className="relative h-full w-full">
				<div className="items-top absolute inset-x-0 top-0 flex gap-4">
					<div className="inline-flex items-center gap-4">
						<motion.img
							src="/app/icons/icon-192x192.png"
							className="size-16 rounded-md"
							layoutId="logo"
						/>
						<motion.div layoutId="title">
							<TypographyH1>
								<T k="welcome.title" />
							</TypographyH1>
						</motion.div>
					</div>
					<div className="flex-1" />
					<motion.div layoutId="skip">
						<Button variant="outline" asChild>
							<Link to="/people" onClick={() => setTourSkipped(true)}>
								<SkipForwardFill />
								<T k="welcome.skip" />
							</Link>
						</Button>
					</motion.div>
				</div>
				<div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
					<div className="mx-auto w-full max-w-md">
						<AnimatePresence mode="wait" custom={direction}>
							<motion.div
								key={steps[currentStep]}
								custom={direction}
								initial="enter"
								animate="center"
								exit="exit"
								variants={{
									enter: (direction: number) => ({
										opacity: 0,
										x: direction > 0 ? 24 : -24,
									}),
									center: { opacity: 1, x: 0 },
									exit: (direction: number) => ({
										opacity: 0,
										x: direction > 0 ? -24 : 24,
									}),
								}}
								transition={{ duration: 0.1 }}
							>
								{getStepComponent(steps[currentStep])}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
				<div className="absolute inset-x-0 bottom-0 flex justify-center">
					{currentStep > 0 && (
						<Button variant="outline" onClick={prevStep} className="h-12">
							<ChevronLeft />
							Previous
						</Button>
					)}
					<div className="flex-1" />
					{currentStep !== steps.length - 1 && (
						<Button onClick={nextStep} className="h-12">
							Next
							<ChevronRight />
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}

function WelcomeStep() {
	return (
		<div className="space-y-8 text-left">
			<TypographyH2>Welcome to Tilly ✨</TypographyH2>
			<TypographyLead>
				Tilly is a pragmatic relationship journal. Built to help you remember
				what&apos;s important and reach out.
			</TypographyLead>
		</div>
	)
}

function InstallPWAStep(props: { onSuccess: () => void }) {
	return (
		<div className="text-muted-foreground space-y-8 text-left">
			<TypographyH2>Install Tilly for the best experience</TypographyH2>
			<InstallationInstructions onInstallComplete={props.onSuccess} />
		</div>
	)
}

function AddPersonStep(props: { onSuccess: () => void }) {
	return (
		<div className="space-y-8 text-left">
			<TypographyH2>Each Person has their own space</TypographyH2>
			<TypographyLead>
				Tilly organizes your journal by person. Get started by adding someone
				important.
			</TypographyLead>
			<div className="flex justify-end">
				<NewPerson onSuccess={props.onSuccess}>
					<Button>
						<PersonPlusFill />
						Add Person
					</Button>
				</NewPerson>
			</div>
		</div>
	)
}

function AddNoteStep(props: { onSuccess: () => void }) {
	let { me } = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
	})

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let firstPerson = people.at(0)

	return (
		<div className="space-y-8 text-left">
			<TypographyH2>Notes for what to remember</TypographyH2>
			<TypographyLead>
				Notes are where you journal what you want to remember about someone.
			</TypographyLead>
			{firstPerson !== undefined && (
				<div className="flex justify-end">
					<NewNote onSuccess={props.onSuccess} personId={firstPerson.$jazz.id}>
						<Button>
							<PlusCircleFill />
							Add note to {firstPerson.name}
						</Button>
					</NewNote>
				</div>
			)}
		</div>
	)
}

function AddReminderStep(props: { onSuccess: () => void }) {
	let { me } = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
	})

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let firstPerson = people.at(0)

	return (
		<div className="space-y-8 text-left">
			<TypographyH2>Reminders to reach out</TypographyH2>
			<TypographyLead>
				Reminders help you stay connected and remember to reach out.
			</TypographyLead>
			{firstPerson !== undefined && (
				<div className="flex justify-end">
					<NewReminder
						onSuccess={props.onSuccess}
						personId={firstPerson.$jazz.id}
					>
						<Button>
							<BellFill />
							Add reminder for {firstPerson.name}
						</Button>
					</NewReminder>
				</div>
			)}
		</div>
	)
}

function FinishSetupStep() {
	let setTourSkipped = useAppStore(s => s.setTourSkipped)

	return (
		<div className="space-y-8 text-left">
			<TypographyH2>Finish your Setup</TypographyH2>
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<CheckCircleFill className="text-primary size-4" />
					<p>Sign up to back up and sync your data</p>
				</div>
				<div className="flex items-center gap-3">
					<CheckCircleFill className="text-primary size-4" />
					<p>Enable Push Notifications</p>
				</div>
				<div className="flex items-center gap-3">
					<CheckCircleFill className="text-primary size-4" />
					<p>Get Tilly Plus to have AI assist you</p>
				</div>
			</div>
			<TypographyLead>You can do all of that in the settings</TypographyLead>
			<div className="flex justify-end">
				<Button asChild>
					<Link to="/settings" onClick={() => setTourSkipped(true)}>
						Go to Settings
					</Link>
				</Button>
			</div>
		</div>
	)
}
