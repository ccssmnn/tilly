import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "#shared/ui/drawer"
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
	render: React.ComponentProps<typeof DrawerTrigger>["render"]
	onSuccess?: (reminderId: string) => void
	personId?: string
}) {
	let me = useAccount(UserAccount)
	let people = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(p => !isDeleted(p))
		},
	})
	let t = useIntl()
	let [selectedPersonId, setSelectedPersonId] = useState(props.personId ?? "")
	let [dialogOpen, setDrawerOpen] = useState(false)
	let [direction, setDirection] = useState<"left" | "right">()

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

	function handleDrawerOpenChange(open: boolean) {
		if (!open) {
			setSelectedPersonId(props.personId ?? "")
		}
		setDrawerOpen(open)
	}

	async function handleSave(values: {
		text: string
		dueAtDate: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	}) {
		if (!me.$isLoaded || !selectedPersonId) return
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
		setDrawerOpen(false)
		setSelectedPersonId(props.personId ?? "")
	}

	return (
		<Drawer open={dialogOpen} onOpenChange={handleDrawerOpenChange}>
			<DrawerTrigger render={props.render} />
			<DrawerContent>
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
								<DrawerHeader>
									<DrawerTitle>
										<T k="reminder.select.title" />
									</DrawerTitle>
									<DrawerDescription>
										<T k="reminder.select.description" />
									</DrawerDescription>
								</DrawerHeader>
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
								<DrawerHeader>
									<DrawerTitle>
										<T k="reminder.add.title" />
									</DrawerTitle>
									<DrawerDescription>
										<T
											k="reminder.add.description"
											params={{ person: selectedPersonLabel }}
										/>
									</DrawerDescription>
								</DrawerHeader>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
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
											onClick={() => handleDrawerOpenChange(false)}
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
			</DrawerContent>
		</Drawer>
	)
}
