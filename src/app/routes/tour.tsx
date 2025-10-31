import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "#shared/ui/button"
import { NewPerson } from "#app/features/new-person"
import { NewNote } from "#app/features/new-note"
import { useAppStore } from "#app/lib/store"
import { motion } from "motion/react"
import {
	TypographyH1,
	TypographyH2,
	TypographyLead,
} from "#shared/ui/typography"
import { T } from "#shared/intl"
import { PersonPlus, Plus } from "react-bootstrap-icons"

export const Route = createFileRoute("/tour")({
	component: TourComponent,
})

function TourComponent() {
	let setTourSkipped = useAppStore(s => s.setTourSkipped)
	let [currentStep, setCurrentStep] = useState(0)

	let steps = ["welcome", "add-person", "add-note"] as const

	function getStepComponent(stepId: (typeof steps)[number]) {
		switch (stepId) {
			case "welcome":
				return <WelcomeStep />
			case "add-person":
				return <AddPersonStep onSuccess={() => setCurrentStep(s => s + 1)} />
			case "add-note":
				return <AddNoteStep onSuccess={() => setCurrentStep(s => s + 1)} />
			default:
				return null
		}
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1)
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1)
		}
	}

	return (
		<div>
			<div className="items-top absolute inset-x-0 top-0 flex gap-4 p-3">
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
				<Button variant="outline" asChild>
					<Link to="/people" onClick={() => setTourSkipped(true)}>
						Skip Tour
					</Link>
				</Button>
			</div>

			<div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
				<div className="w-full max-w-2xl">
					{getStepComponent(steps[currentStep])}
				</div>
			</div>

			<div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
				{currentStep > 0 && (
					<Button variant="outline" onClick={prevStep}>
						Previous
					</Button>
				)}
				<div className="flex-1" />
				{currentStep !== steps.length - 1 && (
					<Button onClick={nextStep}>Next</Button>
				)}
			</div>
		</div>
	)
}

function WelcomeStep() {
	return (
		<div className="space-y-8 text-center">
			<TypographyH2>Welcome to Tilly ✨</TypographyH2>
			<TypographyLead>
				Tilly is a pragmatic relationship journal. Built to help you remember
				what&apos;s important and reach out.
			</TypographyLead>
		</div>
	)
}

function AddPersonStep(props: { onSuccess: () => void }) {
	return (
		<div className="space-y-8 text-center">
			<TypographyH2>Add your first person</TypographyH2>
			<TypographyLead>
				Start journaling by adding your first person to Tilly.
			</TypographyLead>
			<NewPerson onSuccess={props.onSuccess}>
				<Button>
					<PersonPlus />
					Add Person
				</Button>
			</NewPerson>
		</div>
	)
}

function AddNoteStep(props: { onSuccess: () => void }) {
	return (
		<div className="space-y-8 text-center">
			<TypographyH2>Add your first note</TypographyH2>
			<TypographyLead>
				Notes are where you journal what you want to remember about each person.
			</TypographyLead>
			<NewNote onSuccess={props.onSuccess}>
				<Button>
					<Plus />
					Add Note
				</Button>
			</NewNote>
		</div>
	)
}
