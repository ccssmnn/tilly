import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { type ReactNode } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import { ReminderForm } from "#app/features/reminder-form"
import { PersonSelector } from "#app/features/person-selector"
import { createReminder } from "#shared/tools/reminder-create"
import { tryCatch } from "#shared/lib/trycatch"
import { Button } from "#shared/ui/button"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"

export { NewReminder }

function NewReminder(props: {
	children: ReactNode
	onSuccess?: (reminderId: string) => void
	personId?: string
}) {
	let me = useAccount(UserAccount, {
		resolve: {
			root: {
				people: {
					$each: true,
				},
			},
		},
		select: me =>
			me.$isLoaded
				? me
				: me.$jazz.loadingState === "loading"
					? undefined
					: null,
	})
	let t = useIntl()
	let [selectedPersonId, setSelectedPersonId] = useState(props.personId ?? "")
	let [dialogOpen, setDialogOpen] = useState(false)
	let [direction, setDirection] = useState<"left" | "right">()

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let selectedPersonLabel =
		people.find(person => person.$jazz.id === selectedPersonId)?.name ?? ""

	function handlePersonSelected(personId: string) {
		setDirection("right")
		setSelectedPersonId(personId)
	}

	function handleBackToPersonSelection() {
		setDirection("left")
		setSelectedPersonId("")
	}

	function handleDialogOpenChange(open: boolean) {
		if (!open) {
			setSelectedPersonId(props.personId ?? "")
		}
		setDialogOpen(open)
	}

	async function handleSave(values: {
		text: string
		dueAtDate: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	}) {
		if (!me || !selectedPersonId) return

		let result = await tryCatch(
			createReminder(
				{
					text: values.text,
					dueAtDate: values.dueAtDate,
					repeat: values.repeat,
				},
				{
					personId: selectedPersonId,
					worker: me,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		props.onSuccess?.(result.data.reminderID)
		toast.success(t("reminders.created.success"))
		setDialogOpen(false)
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
			<DialogTrigger asChild>{props.children}</DialogTrigger>
			<DialogContent
				titleSlot={
					<div className="relative overflow-hidden">
						<AnimatePresence mode="wait" custom={direction}>
							{!selectedPersonId ? (
								<motion.div
									key="select"
									custom={direction}
									initial="enter"
									animate="center"
									exit="exit"
									variants={{
										enter: (dir: "left" | "right") => ({
											opacity: 0,
											x: { left: -12, right: 12 }[dir],
										}),
										center: { opacity: 1, x: 0 },
										exit: (dir: "left" | "right") => ({
											opacity: 0,
											x: { left: 12, right: -12 }[dir],
										}),
									}}
									transition={{ duration: 0.075 }}
								>
									<DialogHeader>
										<DialogTitle>
											<T k="reminder.select.title" />
										</DialogTitle>
										<DialogDescription>
											<T k="reminder.select.description" />
										</DialogDescription>
									</DialogHeader>
								</motion.div>
							) : (
								<motion.div
									key="form"
									custom={direction}
									initial="enter"
									animate="center"
									exit="exit"
									variants={{
										enter: (dir: "left" | "right") => ({
											opacity: 0,
											x: { left: -12, right: 12 }[dir],
										}),
										center: { opacity: 1, x: 0 },
										exit: (dir: "left" | "right") => ({
											opacity: 0,
											x: { left: 12, right: -12 }[dir],
										}),
									}}
									transition={{ duration: 0.075 }}
								>
									<DialogHeader>
										<DialogTitle>
											<T k="reminder.add.title" />
										</DialogTitle>
										<DialogDescription>
											<T
												k="reminder.add.description"
												params={{ person: selectedPersonLabel }}
											/>
										</DialogDescription>
									</DialogHeader>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				}
			>
				<div className="relative overflow-hidden">
					<AnimatePresence mode="wait" custom={direction}>
						{!selectedPersonId ? (
							<motion.div
								key="select-content"
								custom={direction}
								initial="enter"
								animate="center"
								exit="exit"
								variants={{
									enter: (dir: "left" | "right") => ({
										opacity: 0,
										x: { left: -12, right: 12 }[dir],
									}),
									center: { opacity: 1, x: 0 },
									exit: (dir: "left" | "right") => ({
										opacity: 0,
										x: { left: 12, right: -12 }[dir],
									}),
								}}
								transition={{ duration: 0.075 }}
							>
								<div className="space-y-4">
									<PersonSelector
										onPersonSelected={handlePersonSelected}
										searchPlaceholder={t("reminder.select.search")}
										emptyMessage={t("reminder.select.empty")}
										selectedPersonId={selectedPersonId}
									/>
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => handleDialogOpenChange(false)}
										>
											<T k="common.cancel" />
										</Button>
									</div>
								</div>
							</motion.div>
						) : (
							<motion.div
								key="form-content"
								custom={direction}
								initial="enter"
								animate="center"
								exit="exit"
								variants={{
									enter: (dir: "left" | "right") => ({
										opacity: 0,
										x: { left: -12, right: 12 }[dir],
									}),
									center: { opacity: 1, x: 0 },
									exit: (dir: "left" | "right") => ({
										opacity: 0,
										x: { left: 12, right: -12 }[dir],
									}),
								}}
								transition={{ duration: 0.075 }}
							>
								<ReminderForm
									defaultValues={{
										text: "",
										dueAtDate: new Date().toISOString().substring(0, 10),
									}}
									onSubmit={handleSave}
									onCancel={handleBackToPersonSelection}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	)
}
