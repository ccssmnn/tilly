import { Image as JazzImage, useAccount } from "jazz-tools/react"
import { co, type Loaded } from "jazz-tools"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { isDueToday, isDeleted, UserAccount, Person } from "#shared/schema/user"
import { Link } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { Button } from "#shared/ui/button"
import { TextHighlight } from "#shared/ui/text-highlight"
import { isTextSelectionOngoing } from "#app/lib/utils"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
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
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "#shared/ui/hover-card"
import { updatePerson } from "#shared/tools/person-update"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { useState, type ReactNode } from "react"
import { differenceInDays } from "date-fns"
import { T, useLocale, useIntl } from "#shared/intl/setup"
import { SharedIndicator } from "#app/features/person-shared-indicator"
import {
	SwipeableListItem,
	type SwipeAction,
} from "#shared/ui/swipeable-list-item"
import {
	Trash,
	FileEarmarkText,
	Bell,
	ArrowCounterclockwise,
} from "react-bootstrap-icons"
import { NoteForm } from "#app/features/note-form"
import { ReminderForm } from "#app/features/reminder-form"
import { createNote } from "#shared/tools/note-create"
import { createReminder } from "#shared/tools/reminder-create"
import { updateNote } from "#shared/tools/note-update"
import { updateReminder } from "#shared/tools/reminder-update"
import { useHasHover } from "#app/hooks/use-has-hover"

export { PersonListItem }
export type { PersonListItemPerson }

function PersonListItem({
	person,
	searchQuery,
	noLazy = false,
}: PersonListItemProps) {
	let me = useAccount(UserAccount)
	let t = useIntl()
	let hasHover = useHasHover()
	let [dialogOpen, setDialogOpen] = useState<"note" | "reminder">()
	let [confirmPermanentDeleteOpen, setConfirmPermanentDeleteOpen] =
		useState(false)
	let operations = usePersonItemOperations({ person, me })

	let deletedSwipeActions = {
		leftAction: {
			icon: Trash,
			label: t("person.permanentDelete.button"),
			color: "destructive",
			onAction: () => setConfirmPermanentDeleteOpen(true),
		} satisfies SwipeAction,
		rightActions: {
			primary: {
				icon: ArrowCounterclockwise,
				label: t("person.restore.button"),
				color: "success",
				onAction: () => operations.restore(),
			} satisfies SwipeAction,
		},
	}

	let activeSwipeActions = {
		leftAction: {
			icon: Trash,
			label: t("person.actions.delete"),
			color: "destructive",
			onAction: () => operations.deletePerson(),
		} satisfies SwipeAction,
		rightActions: {
			primary: {
				icon: FileEarmarkText,
				label: t("person.actions.addNote"),
				color: "primary",
				onAction: () => setDialogOpen("note"),
			} satisfies SwipeAction,
			secondary: {
				icon: Bell,
				label: t("person.actions.addReminder"),
				color: "warning",
				onAction: () => setDialogOpen("reminder"),
			} satisfies SwipeAction,
		},
	}

	let linkContent = (
		<Link
			to="/people/$personID"
			params={{ personID: person.$jazz.id }}
			className="items-top hover:bg-muted active:bg-accent flex flex-1 gap-3 rounded-lg py-4 transition-colors duration-150"
			draggable={false}
			onDragStart={e => e.preventDefault()}
			onClick={e => {
				if (isTextSelectionOngoing()) {
					e.preventDefault()
				}
			}}
		>
			<PersonItemContainer person={person} noLazy={noLazy}>
				<PersonItemHeader person={person} searchQuery={searchQuery} />
				<PersonItemSummary person={person} searchQuery={searchQuery} />
			</PersonItemContainer>
		</Link>
	)

	let dialogs = (
		<>
			<AddNoteDialog
				open={dialogOpen === "note"}
				onOpenChange={open => setDialogOpen(open ? "note" : undefined)}
				operations={operations}
			/>
			<AddReminderDialog
				open={dialogOpen === "reminder"}
				onOpenChange={open => setDialogOpen(open ? "reminder" : undefined)}
				operations={operations}
			/>
		</>
	)

	if (person.deletedAt) {
		return (
			<>
				<SwipeableListItem itemKey={person.$jazz.id} {...deletedSwipeActions}>
					<RestorePersonDialog person={person}>
						<div className="items-top hover:bg-muted active:bg-accent flex flex-1 cursor-pointer gap-3 rounded-lg py-4 transition-colors duration-150">
							<PersonItemContainer
								person={person}
								className="grayscale"
								noLazy={noLazy}
							>
								<PersonItemHeader
									person={person}
									nameColor="text-destructive line-clamp-1 font-semibold"
									searchQuery={searchQuery}
								/>
								<PersonItemSummary person={person} searchQuery={searchQuery} />
							</PersonItemContainer>
						</div>
					</RestorePersonDialog>
				</SwipeableListItem>

				<AlertDialog
					open={confirmPermanentDeleteOpen}
					onOpenChange={setConfirmPermanentDeleteOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								<T k="person.permanentDelete.title" />
							</AlertDialogTitle>
							<AlertDialogDescription>
								<T k="person.permanentDelete.confirmation" />
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								<T k="common.cancel" />
							</AlertDialogCancel>
							<AlertDialogAction onClick={() => operations.deletePermanently()}>
								<T k="person.permanentDelete.button" />
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</>
		)
	}

	if (!hasHover) {
		return (
			<SwipeableListItem itemKey={person.$jazz.id} {...activeSwipeActions}>
				{linkContent}
				{dialogs}
			</SwipeableListItem>
		)
	}

	return (
		<>
			<HoverCard>
				<HoverCardTrigger asChild>{linkContent}</HoverCardTrigger>
				<HoverCardContent side="bottom" align="center" className="w-auto p-2">
					<PersonHoverActions
						operations={operations}
						onAddNote={() => setDialogOpen("note")}
						onAddReminder={() => setDialogOpen("reminder")}
					/>
				</HoverCardContent>
			</HoverCard>
			{dialogs}
		</>
	)
}

function PersonItemContainer({
	person,
	children,
	className,
	noLazy = false,
}: {
	person: PersonListItemPerson
	children: React.ReactNode
	className?: string
	noLazy?: boolean
}) {
	return (
		<>
			<Avatar className={`size-16 ${className || ""}`}>
				{person.avatar ? (
					<JazzImage
						loading={noLazy ? "eager" : "lazy"}
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
			<div className="flex-1">{children}</div>
		</>
	)
}

function PersonItemHeader({
	person,
	nameColor = "line-clamp-1 font-semibold",
	searchQuery,
}: {
	person: PersonListItemPerson
	nameColor?: string
	searchQuery?: string
}) {
	let hasDueReminders = person.reminders
		?.filter(reminder => reminder != null)
		?.filter(reminder => !isDeleted(reminder) && reminder.done !== true)
		?.some(reminder => isDueToday(reminder))

	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	return (
		<div
			className="flex items-center justify-between leading-none select-text"
			onMouseDown={e => e.stopPropagation()}
		>
			<div className="flex items-center gap-1.5">
				<p className={nameColor}>
					<TextHighlight text={person.name} query={searchQuery} />
				</p>
				<SharedIndicator item={person} />
				{hasDueReminders && <div className="bg-primary size-2 rounded-full" />}
			</div>
			<p className="text-muted-foreground text-xs text-nowrap">
				{formatDistanceToNow(
					person.updatedAt ||
						person.createdAt ||
						new Date(person.$jazz.lastUpdatedAt || person.$jazz.createdAt),
					{
						addSuffix: true,
						locale: dfnsLocale,
					},
				)}
			</p>
		</div>
	)
}

function PersonItemSummary({
	person,
	searchQuery,
}: {
	person: PersonListItemPerson
	searchQuery?: string
}) {
	if (!person.summary) return null

	let parts = person.summary.split(/(#[a-zA-Z0-9_]+)/)

	return (
		<div className="mt-2 select-text" onMouseDown={e => e.stopPropagation()}>
			<p className="text-muted-foreground line-clamp-2 text-sm">
				{parts.map((part, i) =>
					part.startsWith("#") ? (
						<span key={i} className="text-primary font-bold">
							<TextHighlight text={part} query={searchQuery} />
						</span>
					) : (
						<TextHighlight key={i} text={part} query={searchQuery} />
					),
				)}
			</p>
		</div>
	)
}

function PersonHoverActions({
	operations,
	onAddNote,
	onAddReminder,
}: {
	operations: PersonItemOperations
	onAddNote: () => void
	onAddReminder: () => void
}) {
	let t = useIntl()

	return (
		<div className="flex flex-col gap-1">
			<Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2"
				onClick={e => {
					e.preventDefault()
					e.stopPropagation()
					onAddNote()
				}}
			>
				<FileEarmarkText className="size-4" />
				{t("person.actions.addNote")}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				className="justify-start gap-2"
				onClick={e => {
					e.preventDefault()
					e.stopPropagation()
					onAddReminder()
				}}
			>
				<Bell className="size-4" />
				{t("person.actions.addReminder")}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				className="text-destructive hover:text-destructive justify-start gap-2"
				onClick={e => {
					e.preventDefault()
					e.stopPropagation()
					operations.deletePerson()
				}}
			>
				<Trash className="size-4" />
				{t("person.actions.delete")}
			</Button>
		</div>
	)
}

function RestorePersonDialog({
	person,
	children,
}: {
	person: PersonListItemPerson
	children: ReactNode
}) {
	let me = useAccount(UserAccount)
	let t = useIntl()
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined
	let [open, setOpen] = useState(false)
	let [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

	let deletionInfo = (() => {
		if (!person.deletedAt) return null
		let daysSinceDeletion = differenceInDays(new Date(), person.deletedAt)
		let daysUntilPermanentDeletion = Math.max(0, 30 - daysSinceDeletion)
		return {
			daysSinceDeletion,
			daysUntilPermanentDeletion,
			isDueForPermanentDeletion: daysSinceDeletion >= 30,
		}
	})()

	async function handleRestore() {
		if (!me.$isLoaded) return
		let result = await tryCatch(
			updatePerson(person.$jazz.id, { deletedAt: undefined }, me),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.toast.restored", { name: person.name }))
		setOpen(false)
	}

	async function handlePermanentDelete() {
		if (!me.$isLoaded) return

		let result = await tryCatch(
			updatePerson(person.$jazz.id, { permanentlyDeletedAt: new Date() }, me),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.toast.permanentlyDeleted", { name: person.name }))
		setOpen(false)
	}

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="person.restore.title" params={{ name: person.name }} />
							</DialogTitle>
							<DialogDescription>
								<T
									k="person.restore.deletionInfo"
									params={{
										timeAgo: formatDistanceToNow(
											person.deletedAt ||
												person.updatedAt ||
												person.createdAt ||
												new Date(
													person.$jazz.lastUpdatedAt || person.$jazz.createdAt,
												),
											{
												addSuffix: true,
												locale: dfnsLocale,
											},
										),
									}}
								/>
								{deletionInfo && (
									<>
										{deletionInfo.isDueForPermanentDeletion ? (
											<span className="text-destructive">
												<T k="person.restore.permanentDeletionWarning" />
											</span>
										) : (
											<span>
												<T
													k="person.restore.permanentDeletionCountdown"
													params={{
														days: deletionInfo.daysUntilPermanentDeletion,
													}}
												/>
											</span>
										)}
									</>
								)}
								<T k="person.restore.question" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-3">
						<Button className="h-12 w-full" onClick={handleRestore}>
							<T k="person.restore.title" params={{ name: person.name }} />
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
							<T k="person.permanentDelete.title" />
						</AlertDialogTitle>
						<AlertDialogDescription>
							<T k="person.permanentDelete.confirmation" />
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<T k="common.cancel" />
						</AlertDialogCancel>
						<AlertDialogAction onClick={handlePermanentDelete}>
							<T k="person.permanentDelete.button" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

function AddNoteDialog({
	open,
	onOpenChange,
	operations,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	operations: PersonItemOperations
}) {
	async function handleAddNote(data: NoteFormInput) {
		let result = await operations.addNote(data)
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
							<T k="addNote.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="addNote.description" />
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

function AddReminderDialog({
	open,
	onOpenChange,
	operations,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	operations: PersonItemOperations
}) {
	async function handleAddReminder(data: ReminderFormInput) {
		let result = await operations.addReminder(data)
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
							<T k="addReminder.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="addReminder.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<ReminderForm
					onSubmit={handleAddReminder}
					onCancel={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}

function usePersonItemOperations({
	person,
	me,
}: {
	person: PersonListItemPerson
	me: ReturnType<typeof useAccount<typeof UserAccount>>
}): PersonItemOperations {
	let t = useIntl()

	if (!me.$isLoaded) {
		return {
			deletePerson: async () => {},
			restore: async () => false,
			deletePermanently: async () => false,
			addNote: async () => undefined,
			addReminder: async () => undefined,
		}
	}
	let loadedMe: Loaded<typeof UserAccount> = me

	async function deletePerson() {
		let result = await tryCatch(
			updatePerson(person.$jazz.id, { deletedAt: new Date() }, loadedMe),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.toast.deleted", { name: person.name }), {
			action: {
				label: t("common.undo"),
				onClick: async () => {
					let undoResult = await tryCatch(
						updatePerson(person.$jazz.id, { deletedAt: undefined }, loadedMe),
					)
					if (undoResult.ok) {
						toast.success(t("person.toast.restored", { name: person.name }))
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

	async function restore(): Promise<boolean> {
		let result = await tryCatch(
			updatePerson(person.$jazz.id, { deletedAt: undefined }, loadedMe),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return false
		}

		toast.success(t("person.toast.restored", { name: person.name }))
		return true
	}

	async function deletePermanently(): Promise<boolean> {
		let result = await tryCatch(
			updatePerson(
				person.$jazz.id,
				{ permanentlyDeletedAt: new Date() },
				loadedMe,
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return false
		}

		toast.success(t("person.toast.permanentlyDeleted", { name: person.name }))
		return true
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
					worker: loadedMe,
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
							{ deletedAt: new Date() },
							{
								personId: person.$jazz.id,
								noteId: result.data.noteID,
								worker: loadedMe,
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
		return { success: true }
	}

	async function addReminder(
		data: ReminderFormInput,
	): Promise<{ success: true } | undefined> {
		let result = await tryCatch(
			createReminder(
				{
					text: data.text,
					dueAtDate: data.dueAtDate,
					repeat: data.repeat,
				},
				{
					personId: person.$jazz.id,
					worker: loadedMe,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("reminder.toast.added"), {
			action: {
				label: t("common.undo"),
				onClick: async () => {
					let undoResult = await tryCatch(
						updateReminder(
							{ deletedAt: new Date() },
							{
								personId: person.$jazz.id,
								reminderId: result.data.reminderID,
								worker: loadedMe,
							},
						),
					)
					if (undoResult.ok) {
						toast.success(t("reminder.toast.removed"))
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
		return { success: true }
	}

	return {
		deletePerson,
		restore,
		deletePermanently,
		addNote,
		addReminder,
	}
}

type PersonListItemPerson = co.loaded<
	typeof Person,
	{
		avatar: true
		reminders: { $each: true }
	}
>

type PersonListItemProps = {
	person: PersonListItemPerson
	searchQuery?: string
	noLazy?: boolean
}

type NoteFormInput = {
	content: string
	pinned: boolean
	createdAt: string
}

type ReminderFormInput = {
	text: string
	dueAtDate: string
	repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
}

type PersonItemOperations = {
	deletePerson: () => Promise<void>
	restore: () => Promise<boolean>
	deletePermanently: () => Promise<boolean>
	addNote: (data: NoteFormInput) => Promise<{ success: true } | undefined>
	addReminder: (
		data: ReminderFormInput,
	) => Promise<{ success: true } | undefined>
}
