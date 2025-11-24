import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuItem,
} from "#shared/ui/dropdown-menu"
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
import { isBefore, isToday, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale, useIntl, T } from "#shared/intl/setup"
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
	let operations = useReminderItemOperations({ reminder, person, me })

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
				<RestoreReminderDropdown
					open={dialogOpen === "restore"}
					onOpenChange={open => setDialogOpen(open ? "restore" : undefined)}
					operations={operations}
				>
					<ReminderItemContainer
						reminder={reminder}
						person={person}
						showPerson={showPerson}
						className={dialogOpen === "restore" ? "bg-accent" : ""}
						onClick={() => setDialogOpen("restore")}
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
				</RestoreReminderDropdown>
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
				<DoneReminderDropdown
					open={dialogOpen === "done"}
					onOpenChange={open => setDialogOpen(open ? "done" : undefined)}
					operations={operations}
				>
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
				</DoneReminderDropdown>
			</>
		)
	}

	return (
		<>
			<ActionsDropdown
				open={dialogOpen === "actions"}
				onOpenChange={open => setDialogOpen(open ? "actions" : undefined)}
				onEditClick={() => setDialogOpen("edit")}
				onAddNoteClick={() => setDialogOpen("note")}
				showPerson={showPerson}
				person={person}
				operations={operations}
			>
				<ReminderItemContainer
					reminder={reminder}
					person={person}
					showPerson={showPerson}
					className={dialogOpen ? "bg-accent" : ""}
					onClick={() => setDialogOpen("actions")}
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
			</ActionsDropdown>
			<EditReminderDialog
				open={dialogOpen === "edit"}
				onOpenChange={open => setDialogOpen(open ? "edit" : undefined)}
				reminder={reminder}
				operations={operations}
			/>
			<AddNoteDialog
				person={person}
				open={dialogOpen === "note"}
				onOpenChange={open => setDialogOpen(open ? "note" : undefined)}
				onClose={() => setDialogOpen(undefined)}
				operations={operations}
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
	let baseClassName = cn(
		"hover:bg-muted active:bg-accent flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-4 text-left",
		className,
	)

	return (
		<div className="-mx-3">
			<DropdownMenuTrigger
				id={`reminder-${reminder.$jazz.id}`}
				className={baseClassName}
				onPointerDown={e => {
					if (e.pointerType === "touch") {
						e.preventDefault()
					}
				}}
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
			</DropdownMenuTrigger>
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

function ActionsDropdown({
	open,
	onOpenChange,
	onEditClick,
	onAddNoteClick,
	showPerson,
	person,
	operations,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onEditClick: () => void
	onAddNoteClick: () => void
	showPerson: boolean
	person: co.loaded<typeof Person>
	operations: ReminderItemOperations
	children: ReactNode
}) {
	async function handleDone() {
		onOpenChange(false)
		await operations.markDone()
	}

	async function handleDelete() {
		onOpenChange(false)
		await operations.deleteReminder()
	}

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange} modal>
			{children}
			<DropdownMenuContent align={"center"} side={"top"}>
				<DropdownMenuItem onClick={handleDone}>
					<T k="reminder.actions.markDone" />
					<CheckLg />
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onEditClick}>
					<T k="reminder.actions.edit" />
					<PencilSquare />
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onAddNoteClick}>
					<T k="reminder.actions.addNote" />
					<FileEarmarkText />
				</DropdownMenuItem>
				{showPerson && (
					<DropdownMenuItem asChild>
						<Link
							to="/people/$personID"
							params={{ personID: person.$jazz.id }}
							onClick={() => onOpenChange(false)}
						>
							<T k="reminder.actions.viewPerson" />
							<PersonFill />
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem variant="destructive" onClick={handleDelete}>
					<T k="reminder.actions.delete" />
					<Trash />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function EditReminderDialog({
	open,
	onOpenChange,
	reminder,
	operations,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	reminder: co.loaded<typeof Reminder>
	operations: ReminderItemOperations
}) {
	async function handleEdit(data: ReminderUpdateInput) {
		let result = await operations.updateReminder(data)
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
	operations,
}: {
	person: co.loaded<typeof Person>
	open: boolean
	onOpenChange: (open: boolean) => void
	onClose: () => void
	operations: ReminderItemOperations
}) {
	async function handleAddNote(data: NoteFormInput) {
		let result = await operations.addNote(data)
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

function RestoreReminderDropdown({
	open,
	onOpenChange,
	operations,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	operations: ReminderItemOperations
	children: ReactNode
}) {
	let [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

	async function handleRestore() {
		let restored = await operations.restore()
		if (restored) {
			onOpenChange(false)
		}
	}

	async function handlePermanentDelete() {
		let deleted = await operations.deletePermanently()
		if (deleted) {
			onOpenChange(false)
			setConfirmDeleteOpen(false)
		}
	}

	return (
		<>
			<DropdownMenu open={open} onOpenChange={onOpenChange} modal>
				{children}
				<DropdownMenuContent align={"center"} side={"top"}>
					<DropdownMenuItem onClick={handleRestore}>
						<T k="reminder.restore.button" />
						<ArrowCounterclockwise />
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setConfirmDeleteOpen(true)}
					>
						<T k="reminder.restore.permanentDelete" />
						<Trash />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

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

function DoneReminderDropdown({
	open,
	onOpenChange,
	operations,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	operations: ReminderItemOperations
	children: ReactNode
}) {
	async function handleUndone() {
		onOpenChange(false)
		await operations.markUndone()
	}

	async function handleDelete() {
		onOpenChange(false)
		await operations.deleteReminder()
	}

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange} modal>
			{children}
			<DropdownMenuContent align={"center"} side={"top"}>
				<DropdownMenuItem onClick={handleUndone}>
					<T k="reminder.done.markUndone" />
					<ArrowCounterclockwise />
				</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={handleDelete}>
					<T k="reminder.actions.delete" />
					<Trash />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
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
			wasRescheduled
				? t("reminder.toast.rescheduled")
				: t("reminder.toast.markedDone"),
			{
				action: {
					label: t("common.undo"),
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
									? t("reminder.toast.restoredToPreviousDate")
									: t("reminder.toast.markedNotDone"),
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
				label: t("common.undo"),
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
				label: t("common.undo"),
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
				label: t("common.undo"),
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
				label: t("common.undo"),
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
