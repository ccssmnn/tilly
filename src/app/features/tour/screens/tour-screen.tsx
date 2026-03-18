import { Link } from "@tanstack/react-router"
import { motion, AnimatePresence } from "motion/react"
import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { TypographyH1 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { T } from "#shared/intl"
import { useAppStore } from "#app/lib/store"
import {
	Stars,
	GearFill,
	SkipForwardFill,
	CheckCircleFill,
	PeopleFill,
	FileEarmarkText,
	BellFill,
	PersonPlusFill,
} from "react-bootstrap-icons"
import { NewPerson } from "#app/features/people"
import { NewNote } from "#app/features/notes"
import { NewReminder } from "#app/features/reminders"
import { useTourCarousel, type Direction } from "../lib/use-tour-carousel"
import { TourStep } from "../parts/tour-step"
import { StepNavigation } from "../parts/step-navigation"

let STEPS = [
	"welcome",
	"add-person",
	"add-note",
	"add-reminder",
	"finish-setup",
] as const

type StepId = (typeof STEPS)[number]

export function TourScreen() {
	let setTourSkipped = useAppStore(s => s.setTourSkipped)
	let carousel = useTourCarousel(STEPS.length)

	let people = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(p => !isDeleted(p))
		},
	})

	let firstPerson = people.at(0)

	function advanceStep() {
		carousel.setCurrentStep(s => s + 1)
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
				<TourHeader setTourSkipped={setTourSkipped} />

				<div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
					<div className="mx-auto w-full max-w-md">
						<AnimatePresence mode="wait" custom={carousel.direction}>
							<motion.div
								key={STEPS[carousel.currentStep]}
								custom={carousel.direction}
								initial="enter"
								animate="center"
								exit="exit"
								drag="x"
								dragConstraints={{ left: 0, right: 0 }}
								dragElastic={0.2}
								onDragEnd={carousel.handleDragEnd}
								variants={{
									enter: (dir: Direction) => ({
										opacity: 0,
										x: { left: -12, right: 12, _: 0 }[dir ?? "_"],
									}),
									center: { opacity: 1, x: 0 },
									exit: (dir: Direction) => ({
										opacity: 0,
										x: { left: 12, right: -12, _: 0 }[dir ?? "_"],
									}),
								}}
								transition={{
									duration: 0.075,
									delay: carousel.direction === undefined ? 0.5 : 0,
								}}
								style={{ touchAction: "pan-y" }}
							>
								<StepContent
									step={STEPS[carousel.currentStep]}
									firstPerson={firstPerson}
									onAdvance={advanceStep}
									setTourSkipped={setTourSkipped}
								/>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>

				<StepNavigation
					currentStep={carousel.currentStep}
					stepCount={STEPS.length}
					onPrev={carousel.prev}
					onNext={carousel.next}
					onDotClick={carousel.goTo}
				/>
			</div>
		</div>
	)
}

function TourHeader({
	setTourSkipped,
}: {
	setTourSkipped: (skipped: boolean) => void
}) {
	return (
		<div className="items-top absolute inset-x-0 top-0 flex gap-4">
			<Link to="/" className="inline-flex items-center gap-4">
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
			</Link>
			<div className="flex-1" />
			<motion.div layoutId="skip">
				<Button
					nativeButton={false}
					variant="outline"
					render={<Link to="/people" onClick={() => setTourSkipped(true)} />}
				>
					<SkipForwardFill />
					<T k="welcome.skip" />
				</Button>
			</motion.div>
		</div>
	)
}

function StepContent({
	step,
	firstPerson,
	onAdvance,
	setTourSkipped,
}: {
	step: StepId
	firstPerson: { $jazz: { id: string }; name: string } | undefined
	onAdvance: () => void
	setTourSkipped: (skipped: boolean) => void
}) {
	switch (step) {
		case "welcome":
			return (
				<TourStep
					icon={<Stars />}
					title={<T k="welcome.title" />}
					description={<T k="welcome.description" />}
				/>
			)

		case "add-person":
			return (
				<TourStep
					icon={<PeopleFill />}
					title={<T k="addPerson.title" />}
					description={<T k="addPerson.description" />}
				>
					<NewPerson
						onSuccess={() => onAdvance()}
						render={
							<Button>
								<PeopleFill />
								<T k="addPerson.button" />
							</Button>
						}
					/>
				</TourStep>
			)

		case "add-note":
			return (
				<TourStep
					icon={<FileEarmarkText />}
					title={<T k="addNote.title" />}
					description={<T k="addNote.description" />}
				>
					{firstPerson ? (
						<NewNote
							onSuccess={onAdvance}
							personId={firstPerson.$jazz.id}
							render={
								<Button>
									<FileEarmarkText />
									<T k="addNote.button" params={{ name: firstPerson.name }} />
								</Button>
							}
						/>
					) : (
						<NewPerson
							render={
								<Button>
									<PersonPlusFill />
									<T k="addPerson.button" />
								</Button>
							}
						/>
					)}
				</TourStep>
			)

		case "add-reminder":
			return (
				<TourStep
					icon={<BellFill />}
					title={<T k="addReminder.title" />}
					description={<T k="addReminder.description" />}
				>
					{firstPerson ? (
						<NewReminder
							onSuccess={onAdvance}
							personId={firstPerson.$jazz.id}
							render={
								<Button>
									<BellFill />
									<T
										k="addReminder.button"
										params={{ name: firstPerson.name }}
									/>
								</Button>
							}
						/>
					) : (
						<NewPerson
							render={
								<Button>
									<PersonPlusFill />
									<T k="addPerson.button" />
								</Button>
							}
						/>
					)}
				</TourStep>
			)

		case "finish-setup":
			return (
				<TourStep
					icon={<GearFill />}
					title="Finish your Setup in the Settings"
					description={
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<CheckCircleFill className="text-primary size-4" />
								<p>
									<T k="finish.backup" />
								</p>
							</div>
							<div className="flex items-center gap-3">
								<CheckCircleFill className="text-primary size-4" />
								<p>
									<T k="finish.notifications" />
								</p>
							</div>
							<div className="flex items-center gap-3">
								<CheckCircleFill className="text-primary size-4" />
								<p>
									<T k="finish.plus" />
								</p>
							</div>
						</div>
					}
				>
					<Button>
						<Link to="/settings" onClick={() => setTourSkipped(true)}>
							<T k="finish.button" />
						</Link>
					</Button>
				</TourStep>
			)
	}
}
