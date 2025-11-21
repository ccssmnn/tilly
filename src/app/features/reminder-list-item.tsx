import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	Popover,
	PopoverContent,
	PopoverAnchor,
	PopoverTrigger,
} from "#shared/ui/popover"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#shared/ui/alert-dialog"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Person, Reminder, UserAccount } from "#shared/schema/user"
import { co, type Loaded } from "jazz-tools"
import {
	Calendar,
	PencilSquare,
	ArrowRepeat,
	Trash,
	FileEarmarkText,
	PersonFill,
	CheckLg,
	ArrowCounterclockwise,
} from "react-bootstrap-icons"
import { useState, type ReactNode } from "react"
import { ReminderForm } from "./reminder-form"
import { Link } from "@tanstack/react-router"
import { Image as JazzImage } from "jazz-tools/react"
import {
	isBefore,
	isToday,
	formatDistanceToNow,
	differenceInDays,
} from "date-fns"
import { toast } from "sonner"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale, useIntl, T } from "#shared/intl/setup"
import { useIsMobile } from "#app/hooks/use-mobile"
import { cn, isTextSelectionOngoing } from "#app/lib/utils"
import { updateReminder } from "#shared/tools/reminder-update"
import { tryCatch } from "#shared/lib/trycatch"
import { NoteForm } from "#app/features/note-form"
import { createNote } from "#shared/tools/note-create"
import { updateNote } from "#shared/tools/note-update"
import { TextHighlight } from "#shared/ui/text-highlight"

export { ReminderListItem }

function ReminderListItem({
	reminder,
	person,
	me,
	showPerson = true,
	searchQuery,
}: {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	me: Loaded<typeof UserAccount>
	showPerson?: boolean
	searchQuery?: string
}) {
	let t = useIntl()
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined
	let [dialogOpen, setDialogOpen] = useState<
		"actions" | "edit" | "note" | "restore" | "done" | undefined
	>()
	let [anchorPos, setAnchorPos] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	})
	let operations = useReminderItemOperations({ reminder, person, me })

	function handleReminderClick(e: React.MouseEvent) {
		setAnchorPos({ x: e.clientX, y: e.clientY })
		setDialogOpen("actions")
	}

	if (reminder.deletedAt) {
		let deletedRelativeTime = formatDistanceToNow(
			getReminderDeletedDate(reminder),
			{
				addSuffix: true,
				locale: dfnsLocale,
			},
		)
		let deletedLabel = t("reminder.status.deleted", {
			relativeTime: deletedRelativeTime,
		})

		return (
			<>
				<ReminderItemContainer
					reminder={reminder}
					person={person}
					showPerson={showPerson}
					className={dialogOpen === "restore" ? "bg-accent" : ""}
					onClick={_e => setDialogOpen("restore")}
				>
					<div className="space-y-1 select-text">
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
							<span className="text-destructive inline-flex items-center gap-1 [&>svg]:size-3">
								<Trash />
								<span>{deletedLabel}</span>
							</span>
							{showPerson ? (
								<span className="text-muted-foreground font-normal">
									<TextHighlight text={person.name} query={searchQuery} />
								</span>
							) : null}
						</div>
						<ReminderItemText reminder={reminder} searchQuery={searchQuery} />
					</div>
				</ReminderItemContainer>
				<RestoreReminderDialog
					reminder={reminder}
					open={dialogOpen === "restore"}
					onOpenChange={open => setDialogOpen(open ? "restore" : undefined)}
					onRestore={operations.restore}
					onPermanentDelete={operations.deletePermanently}
				/>
			</>
		)
	}

	if (reminder.done) {
		let doneRelativeTime = formatDistanceToNow(
			getReminderReferenceDate(reminder),
			{
				addSuffix: true,
				locale: dfnsLocale,
			},
		)
		let doneLabel = t("reminder.status.done", {
			relativeTime: doneRelativeTime,
		})

		return (
			<>
				<ReminderItemContainer
					reminder={reminder}
					person={person}
					showPerson={showPerson}
					className={dialogOpen === "done" ? "bg-accent" : ""}
					onClick={_e => setDialogOpen("done")}
				>
					<div className="space-y-1 select-text">
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
							<span className="inline-flex items-center gap-1 text-emerald-500 [&>svg]:size-3">
								<CheckLg />
								<span>{doneLabel}</span>
							</span>
							{showPerson ? (
								<span className="text-muted-foreground font-normal">
									<TextHighlight text={person.name} query={searchQuery} />
								</span>
							) : null}
						</div>
						<ReminderItemText reminder={reminder} searchQuery={searchQuery} />
					</div>
				</ReminderItemContainer>
				<DoneReminderActionsDialog
					open={dialogOpen === "done"}
					onOpenChange={open => setDialogOpen(open ? "done" : undefined)}
					onUndo={operations.markUndone}
					onDelete={operations.deleteReminder}
				/>
			</>
		)
	}

	return (
		<>
			<ActionsPopover
				showPerson={showPerson}
				person={person}
				open={dialogOpen === "actions"}
				onOpenChange={open => setDialogOpen(open ? "actions" : undefined)}
				onEditClick={() => setDialogOpen("edit")}
				onAddNoteClick={() => setDialogOpen("note")}
				onDone={operations.markDone}
				onDelete={operations.deleteReminder}
			>
				<ReminderItemContainer
					reminder={reminder}
					person={person}
					showPerson={showPerson}
					className={dialogOpen ? "bg-accent" : ""}
					onClick={handleReminderClick}
				>
					<div className="flex items-start gap-3 select-text">
						<div
							className={cn(
								"inline-flex items-center gap-1 text-sm [&>svg]:size-3",
								isToday(new Date(reminder.dueAtDate)) ||
									isBefore(new Date(reminder.dueAtDate), new Date())
									? "text-destructive"
									: "text-foreground",
							)}
						>
							{reminder.repeat === undefined ? <Calendar /> : <ArrowRepeat />}
							{new Date(reminder.dueAtDate).toLocaleDateString(locale)}
						</div>
						{showPerson && (
							<p className="text-muted-foreground line-clamp-1 text-left text-sm">
								<TextHighlight text={person.name} query={searchQuery} />
							</p>
						)}
					</div>
					<p className="text-md/tight text-left select-text">
						<TextHighlight text={reminder.text} query={searchQuery} />
					</p>
				</ReminderItemContainer>
			</ActionsPopover>
			<EditReminderDialog
				open={dialogOpen === "edit"}
				onOpenChange={open => setDialogOpen(open ? "edit" : undefined)}
				reminder={reminder}
				onSubmit={operations.updateReminder}
			/>
			<AddNoteDialog
				person={person}
				open={dialogOpen === "note"}
				onOpenChange={open => setDialogOpen(open ? "note" : undefined)}
				onClose={() => setDialogOpen(undefined)}
				onSubmit={operations.addNote}
			/>
		</>
	)
}

function ReminderItemContainer({
	reminder,
	person,
	showPerson,
	className,
	children,
	onClick,
}: {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	showPerson: boolean
	className?: string
	children: React.ReactNode
	onClick: (e: React.MouseEvent) => void
}) {
	return (
		<div className="-mx-3">
			<PopoverTrigger
				id={`reminder-${reminder.$jazz.id}`}
				className={cn(
					"hover:bg-muted active:bg-accent flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-4 text-left",
					className,
				)}
				onClick={e => {
					if (isTextSelectionOngoing()) return
					onClick(e)
				}}
			>
				{showPerson ? (
					<div className="relative size-16">
						<Avatar
							className={cn("size-full", reminder.deletedAt && "grayscale")}
						>
							{person.avatar ? (
								<JazzImage
									imageId={person.avatar.$jazz.id}
									alt={person.name}
									width={64}
									data-slot="avatar-image"
									className="aspect-square size-full object-cover shadow-inner"
								/>
							) : (
								<AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
							)}
						</Avatar>
						{!reminder.deletedAt && reminder.done ? (
							<span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-emerald-400" />
						) : null}
					</div>
				) : null}
				<div className="min-w-0 flex-1 space-y-1">{children}</div>
			</PopoverTrigger>
		</div>
	)
}

function ReminderItemText({
	reminder,
	statusText,
	statusColor,
	searchQuery,
}: {
	reminder: co.loaded<typeof Reminder>
	statusText?: string
	statusColor?: string
	searchQuery?: string
}) {
	let baseClassName = "text-md/tight text-left"
	if (statusText && statusColor?.includes("text-muted-foreground")) {
		baseClassName = "text-md/tight text-muted-foreground text-left"
	}

	return (
		<p className={baseClassName}>
			{statusText && (
				<span className={cn("mr-3 text-sm font-medium", statusColor)}>
					{statusText}
				</span>
			)}
			<TextHighlight text={reminder.text} query={searchQuery} />
		</p>
	)
}

function getReminderReferenceDate(reminder: co.loaded<typeof Reminder>) {
	return (
		reminder.updatedAt ||
		reminder.createdAt ||
		new Date(reminder.$jazz.lastUpdatedAt || reminder.$jazz.createdAt)
	)
}

function getReminderDeletedDate(reminder: co.loaded<typeof Reminder>) {
	return reminder.deletedAt ?? getReminderReferenceDate(reminder)
}

function ActionsPopover({
	showPerson,
	person,
	open,
	onOpenChange,
	onEditClick,
	onAddNoteClick,
	onDone,
	onDelete,
	children,
}: {
	children: ReactNode
	showPerson: boolean
	person: co.loaded<typeof Person>
	open: boolean
	onOpenChange: (open: boolean) => void
	onEditClick: () => void
	onAddNoteClick: () => void
	onDone: () => Promise<void>
	onDelete: () => Promise<void>
}) {
	async function handleDone() {
		onOpenChange(false)
		await onDone()
	}

	async function handleDelete() {
		onOpenChange(false)
		await onDelete()
	}

	return (
		<Popover open={open} onOpenChange={onOpenChange} modal>
			{children}
			<PopoverContent
				className="w-48 p-1.5"
				align={"center"}
				side={"top"}
				sideOffset={8}
			>
				<div className="flex flex-col gap-1.5">
					<Button className="h-11 justify-start" onClick={handleDone}>
						<CheckLg />
						<T k="reminder.actions.markDone" />
					</Button>
					<Button
						variant="outline"
						className="h-11 justify-start"
						onClick={onEditClick}
					>
						<PencilSquare />
						<T k="reminder.actions.edit" />
					</Button>
					<Button
						variant="outline"
						className="h-11 justify-start"
						onClick={onAddNoteClick}
					>
						<FileEarmarkText />
						<T k="reminder.actions.addNote" />
					</Button>
					{showPerson && (
						<Button
							variant="outline"
							className="h-11 justify-start"
							onClick={() => onOpenChange(false)}
							asChild
						>
							<Link
								to="/people/$personID"
								params={{ personID: person.$jazz.id }}
							>
								<PersonFill />
								<T k="reminder.actions.viewPerson" />
							</Link>
						</Button>
					)}
					<Button
						variant="destructive"
						className="h-11 justify-start"
						onClick={handleDelete}
					>
						<Trash />
						<T k="reminder.actions.delete" />
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	)
}

function EditReminderDialog({
	open,
	onOpenChange,
	reminder,
	onSubmit,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	reminder: co.loaded<typeof Reminder>
	onSubmit: (
		data: ReminderUpdateInput,
	) => Promise<{ success: true } | undefined>
}) {
	async function handleEdit(data: ReminderUpdateInput) {
		let result = await onSubmit(data)
		if (result?.success) {
			onOpenChange(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="reminder.edit.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="reminder.edit.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<ReminderForm
					defaultValues={{
						text: reminder.text,
						dueAtDate: reminder.dueAtDate,
						repeat: reminder.repeat,
					}}
					onSubmit={handleEdit}
					onCancel={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}

function AddNoteDialog({
	person,
	open,
	onOpenChange,
	onClose,
	onSubmit,
}: {
	person: co.loaded<typeof Person>
	open: boolean
	onOpenChange: (open: boolean) => void
	onClose: () => void
	onSubmit: (data: NoteFormInput) => Promise<{ success: true } | undefined>
}) {
	async function handleAddNote(data: NoteFormInput) {
		let result = await onSubmit(data)
		if (result?.success) {
			onClose()
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T
								k="reminder.addNote.title"
								params={{ personName: person.name }}
							/>
						</DialogTitle>
						<DialogDescription>
							<T
								k="reminder.addNote.description"
								params={{ personName: person.name }}
							/>
						</DialogDescription>
					</DialogHeader>
				}
			>
				<NoteForm
					onSubmit={handleAddNote}
					onCancel={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}

function RestoreReminderDialog({
	reminder,
	open,
	onOpenChange,
	onRestore,
	onPermanentDelete,
}: {
	reminder: co.loaded<typeof Reminder>
	open: boolean
	onOpenChange: (open: boolean) => void
	onRestore: () => Promise<boolean>
	onPermanentDelete: () => Promise<boolean>
}) {
	let [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

	let deletionInfo = (() => {
		if (!reminder.deletedAt) return null
		let daysSinceDeletion = differenceInDays(new Date(), reminder.deletedAt)
		let daysUntilPermanentDeletion = Math.max(0, 30 - daysSinceDeletion)
		return {
			daysSinceDeletion,
			daysUntilPermanentDeletion,
			isDueForPermanentDeletion: daysSinceDeletion >= 30,
		}
	})()

	async function handleRestore() {
		let restored = await onRestore()
		if (restored) {
			onOpenChange(false)
		}
	}

	async function handlePermanentDelete() {
		let deleted = await onPermanentDelete()
		if (deleted) {
			onOpenChange(false)
		}
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="reminder.restore.title" />
							</DialogTitle>
							<DialogDescription>
								<T
									k="reminder.restore.deletionInfo"
									params={{
										timeAgo: formatDistanceToNow(
											reminder.deletedAt ||
												reminder.updatedAt ||
												reminder.createdAt ||
												new Date(
													reminder.$jazz.lastUpdatedAt ||
														reminder.$jazz.createdAt,
												),
											{
												addSuffix: true,
												locale: useLocale() === "de" ? dfnsDe : undefined,
											},
										),
									}}
								/>
								{deletionInfo && (
									<>
										{deletionInfo.isDueForPermanentDeletion ? (
											<span className="text-destructive">
												<T k="reminder.restore.permanentDeletionWarning" />
											</span>
										) : (
											<T
												k="reminder.restore.permanentDeletionCountdown"
												params={{
													days: deletionInfo.daysUntilPermanentDeletion,
												}}
											/>
										)}
									</>
								)}
								<T k="reminder.restore.question" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-3">
						<Button className="h-12 w-full" onClick={handleRestore}>
							<T k="reminder.restore.button" />
						</Button>
						<Button
							variant="destructive"
							className="h-12 w-full"
							onClick={() => setConfirmDeleteOpen(true)}
						>
							<T k="reminder.restore.permanentDelete" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<T k="reminder.permanentDelete.title" />
						</AlertDialogTitle>
						<AlertDialogDescription>
							<T k="reminder.permanentDelete.confirmation" />
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<T k="reminder.permanentDelete.cancel" />
						</AlertDialogCancel>
						<AlertDialogAction onClick={handlePermanentDelete}>
							<T k="reminder.permanentDelete.confirm" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

function DoneReminderActionsDialog({
	open,
	onOpenChange,
	onUndo,
	onDelete,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onUndo: () => Promise<void>
	onDelete: () => Promise<void>
}) {
	async function handleUndone() {
		onOpenChange(false)
		await onUndo()
	}

	async function handleDelete() {
		onOpenChange(false)
		await onDelete()
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="reminder.done.actions.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="reminder.done.actions.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-3">
					<Button className="h-12 w-full" onClick={handleUndone}>
						<ArrowCounterclockwise />
						<T k="reminder.done.markUndone" />
					</Button>
					<Button
						variant="destructive"
						className="h-12 w-full"
						onClick={handleDelete}
					>
						<Trash />
						<T k="reminder.actions.delete" />
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

type ReminderUpdateInput = {
	text: string
	dueAtDate: string
	repeat?:
		| {
				interval: number
				unit: "day" | "week" | "month" | "year"
		  }
		| undefined
}

type NoteFormInput = {
	content: string
	pinned: boolean
	createdAt: string
}

type ReminderItemOperations = {
	markDone: () => Promise<void>
	markUndone: () => Promise<void>
	updateReminder: (
		data: ReminderUpdateInput,
	) => Promise<{ success: true } | undefined>
	deleteReminder: () => Promise<void>
	addNote: (data: NoteFormInput) => Promise<{ success: true } | undefined>
	restore: () => Promise<boolean>
	deletePermanently: () => Promise<boolean>
}

function useReminderItemOperations({
	reminder,
	person,
	me,
}: {
	reminder: co.loaded<typeof Reminder>
	person: co.loaded<typeof Person>
	me: Loaded<typeof UserAccount>
}): ReminderItemOperations {
	let t = useIntl()

	async function markDone() {
		let result = await tryCatch(
			updateReminder(
				{ done: true },
				{
					worker: me,
					personId: person.$jazz.id,
					reminderId: reminder.$jazz.id,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		let wasRepeating = result.data.previous.repeat !== undefined
		let wasRescheduled = wasRepeating && !result.data.current.done

		toast.success(
			wasRescheduled ? "Reminder rescheduled" : "Reminder marked as done",
			{
				action: {
					label: "Undo",
					onClick: async () => {
						let undoUpdates = wasRescheduled
							? { done: false, dueAtDate: result.data.previous.dueAtDate }
							: { done: false }

						let undoResult = await tryCatch(
							updateReminder(undoUpdates, {
								worker: me,
								personId: person.$jazz.id,
								reminderId: reminder.$jazz.id,
							}),
						)
						if (undoResult.ok) {
							toast.success(
								wasRescheduled
									? "Reminder restored to previous date"
									: "Reminder marked as not done",
							)
						} else {
							toast.error(
								typeof undoResult.error === "string"
									? undoResult.error
									: undoResult.error.message,
							)
						}
					},
				},
			},
		)
	}

	async function markUndone() {
		let result = await tryCatch(
			updateReminder(
				{ done: false },
				{
					worker: me,
					personId: person.$jazz.id,
					reminderId: reminder.$jazz.id,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("reminder.toast.markedUndone"), {
			action: {
				label: "Undo",
				onClick: async () => {
					let undoResult = await tryCatch(
						updateReminder(
							{ done: true },
							{
								worker: me,
								personId: person.$jazz.id,
								reminderId: reminder.$jazz.id,
							},
						),
					)
					if (undoResult.ok) {
						toast.success(t("reminder.toast.markedDoneAgain"))
					} else {
						toast.error(
							typeof undoResult.error === "string"
								? undoResult.error
								: undoResult.error.message,
						)
					}
				},
			},
		})
	}

	async function updateReminderInternal(
		data: ReminderUpdateInput,
	): Promise<{ success: true } | undefined> {
		let updates = {
			text: data.text,
			dueAtDate: data.dueAtDate,
			repeat: data.repeat,
		}

		let result = await tryCatch(
			updateReminder(updates, {
				worker: me,
				personId: person.$jazz.id,
				reminderId: reminder.$jazz.id,
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("reminder.toast.updated"), {
			action: {
				label: "Undo",
				onClick: async () => {
					let undoResult = await tryCatch(
						updateReminder(result.data.previous, {
							worker: me,
							personId: person.$jazz.id,
							reminderId: reminder.$jazz.id,
						}),
					)
					if (undoResult.ok) {
						toast.success(t("reminder.toast.updateUndone"))
					} else {
						toast.error(
							typeof undoResult.error === "string"
								? undoResult.error
								: undoResult.error.message,
						)
					}
				},
			},
		})
		return { success: true } as const
	}

	async function deleteReminder() {
		let result = await tryCatch(
			updateReminder(
				{ deletedAt: new Date() },
				{
					worker: me,
					personId: person.$jazz.id,
					reminderId: reminder.$jazz.id,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("reminder.toast.deleted"), {
			duration: 5000,
			action: {
				label: "Undo",
				onClick: async () => {
					let undoResult = await tryCatch(
						updateReminder(
							{ deletedAt: undefined },
							{
								worker: me,
								personId: person.$jazz.id,
								reminderId: reminder.$jazz.id,
							},
						),
					)
					if (undoResult.ok) {
						toast.success(t("reminder.toast.restored"))
					} else {
						toast.error(
							typeof undoResult.error === "string"
								? undoResult.error
								: undoResult.error.message,
						)
					}
				},
			},
		})
	}

	async function addNote(
		data: NoteFormInput,
	): Promise<{ success: true } | undefined> {
		let result = await tryCatch(
			createNote(
				{
					title: "",
					content: data.content,
					pinned: data.pinned,
				},
				{
					personId: person.$jazz.id,
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

		toast.success(t("note.toast.added"), {
			action: {
				label: "Undo",
				onClick: async () => {
					let undoResult = await tryCatch(
						updateNote(
							{
								deletedAt: new Date(),
							},
							{
								personId: person.$jazz.id,
								noteId: result.data.noteID,
								worker: me,
							},
						),
					)
					if (undoResult.ok) {
						toast.success(t("note.toast.removed"))
					} else {
						toast.error(
							typeof undoResult.error === "string"
								? undoResult.error
								: undoResult.error.message,
						)
					}
				},
			},
		})
		return { success: true } as const
	}

	async function restore(): Promise<boolean> {
		let result = await tryCatch(
			updateReminder(
				{ deletedAt: undefined },
				{
					worker: me,
					personId: person.$jazz.id,
					reminderId: reminder.$jazz.id,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return false
		}

		toast.success(t("reminder.toast.restored"))
		return true
	}

	async function deletePermanently(): Promise<boolean> {
		let result = await tryCatch(
			updateReminder(
				{ permanentlyDeletedAt: new Date() },
				{
					worker: me,
					personId: person.$jazz.id,
					reminderId: reminder.$jazz.id,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return false
		}

		toast.success(t("reminder.toast.permanentlyDeleted"))
		return true
	}

	return {
		markDone,
		markUndone,
		updateReminder: updateReminderInternal,
		deleteReminder,
		addNote,
		restore,
		deletePermanently,
	}
}
