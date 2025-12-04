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
	children: ReactNode
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
	let [dialogOpen, setDialogOpen] = useState(false)
	let [direction, setDirection] = useState<"left" | "right">()

	let selectedPersonLabel =
		people.find(person => person.$jazz.id === selectedPersonId)?.name ?? ""

	function handleDialogOpenChange(open: boolean) {
		if (!open) {
			setSelectedPersonId(props.personId ?? "")
		}
		setDialogOpen(open)
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
		setDialogOpen(false)
		setSelectedPersonId(props.personId ?? "")
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
											<T k="note.select.title" />
										</DialogTitle>
										<DialogDescription>
											<T k="note.select.description" />
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
											<T k="note.add.title" />
										</DialogTitle>
										<DialogDescription>
											<T
												k="note.add.description"
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
			</DialogContent>
		</Dialog>
	)
}
