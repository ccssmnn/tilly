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
import { Button } from "#shared/ui/button"
import { NoteForm } from "#app/features/note-form"
import { PersonSelector } from "#app/features/person-selector"
import { createNote } from "#shared/tools/note-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { format } from "date-fns"

export { NewNote }

function NewNote(props: {
	render: React.ComponentProps<typeof DrawerTrigger>["render"]
	onSuccess?: (noteId: string) => void
	personId?: string
}) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let people = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(person => person && !isDeleted(person))
		},
	})
	let [selectedPersonId, setSelectedPersonId] = useState(props.personId ?? "")
	let [dialogOpen, setDrawerOpen] = useState(false)
	let [direction, setDirection] = useState<"left" | "right">()

	let selectedPersonLabel =
		people.find(person => person.$jazz.id === selectedPersonId)?.name ?? ""

	function handleDrawerOpenChange(open: boolean) {
		if (!open) {
			setSelectedPersonId(props.personId ?? "")
		}
		setDrawerOpen(open)
	}

	function handlePersonSelected(personId: string) {
		setDirection("right")
		setSelectedPersonId(personId)
	}

	function handleBackToPersonSelection() {
		setDirection("left")
		setSelectedPersonId("")
	}

	async function handleSave(values: {
		content: string
		pinned: boolean
		images?: File[]
	}) {
		if (!me.$isLoaded || !selectedPersonId) return

		let result = await tryCatch(
			createNote(
				{
					title: "",
					content: values.content,
					pinned: values.pinned,
					imageFiles: values.images,
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

		props.onSuccess?.(result.data.noteID)
		toast.success(t("notes.created.success"))
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
										<T k="note.select.title" />
									</DrawerTitle>
									<DrawerDescription>
										<T k="note.select.description" />
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
										<T k="note.add.title" />
									</DrawerTitle>
									<DrawerDescription>
										<T
											k="note.add.description"
											params={{ person: selectedPersonLabel }}
										/>
									</DrawerDescription>
								</DrawerHeader>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
				<div className="relative">
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
										searchPlaceholder={t("note.select.search")}
										emptyMessage={t("note.select.empty")}
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
								<NoteForm
									defaultValues={{
										content: "",
										pinned: false,
										createdAt: format(new Date(), "yyyy-MM-dd"),
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
