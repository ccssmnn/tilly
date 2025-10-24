import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
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
import { Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { PencilSquare, Trash, PinFill } from "react-bootstrap-icons"
import { useState, useRef, useEffect } from "react"
import { NoteForm } from "./note-form"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { cn, isTextSelectionOngoing } from "#app/lib/utils"
import { toast } from "sonner"
import { updateNote } from "#shared/tools/note-update"
import { tryCatch } from "#shared/lib/trycatch"
import { Badge } from "#shared/ui/badge"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { de as dfnsDe } from "date-fns/locale"
import { Markdown } from "#shared/ui/markdown"

export { NoteListItem }

function NoteListItem(props: {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	searchQuery?: string
}) {
	let t = useIntl()
	let [openDialog, setOpenDialog] = useState<"actions" | "restore" | "edit">()
	let [isExpanded, setIsExpanded] = useState(false)

	let { contentRef, hasOverflow } = useContentOverflow(
		props.note.content,
		isExpanded,
	)

	return (
		<>
			<div
				className={cn(
					openDialog !== undefined && "bg-accent",
					"-mx-3 rounded-md px-3",
				)}
			>
				<button
					id={`note-${props.note.$jazz.id}`}
					onClick={() => {
						if (isTextSelectionOngoing()) return
						setOpenDialog(props.note.deletedAt ? "restore" : "actions")
					}}
					className={cn(
						"block w-full space-y-2",
						hasOverflow ? "pt-4" : "py-4",
					)}
				>
					<div className="flex items-center gap-3 select-text">
						{props.note.deletedAt ? (
							<span className="text-destructive">
								<T k="note.status.deleted" />
							</span>
						) : (
							<>
								<Pinned pinned={props.note.pinned} />
								<div className="flex-1" />
								<TimeStamp record={props.note} />
							</>
						)}
					</div>
					<div>
						<div
							ref={contentRef}
							className={cn(
								"text-left text-wrap select-text",
								props.note.deletedAt && "text-muted-foreground",
								!isExpanded && "line-clamp-2",
							)}
						>
							<MarkdownWithHighlight
								content={props.note.content}
								searchQuery={props.searchQuery}
							/>
						</div>
					</div>
				</button>
				<div
					className="hidden pb-4 data-[overflow=true]:block"
					data-overflow={hasOverflow}
				>
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-muted-foreground -m-1 p-1 text-xs font-bold hover:underline"
					>
						{isExpanded ? <T k="note.showLess" /> : <T k="note.showMore" />}
					</button>
				</div>
			</div>
			<ActionsDialog
				note={props.note}
				person={props.person}
				open={openDialog === "actions"}
				onOpenChange={() => setOpenDialog(undefined)}
				onDelete={async () => {
					await deleteNote(props.person.$jazz.id, props.note.$jazz.id, t)
					setOpenDialog(undefined)
				}}
				onEdit={() => setOpenDialog("edit")}
				onPin={async () => {
					await pinOrUnpinNote(
						props.person.$jazz.id,
						props.note.$jazz.id,
						t,
						props.note.pinned,
					)
					setOpenDialog(undefined)
				}}
			/>
			<EditDialog
				note={props.note}
				person={props.person}
				open={openDialog === "edit"}
				onOpenChange={() => setOpenDialog(undefined)}
			/>
			<RestoreNoteDialog
				note={props.note}
				person={props.person}
				open={openDialog === "restore"}
				onOpenChange={() => setOpenDialog(undefined)}
			/>
		</>
	)
}

function MarkdownWithHighlight({
	content,
	searchQuery,
}: MarkdownWithHighlightProps) {
	if (!searchQuery || !searchQuery.trim()) {
		return <Markdown>{content}</Markdown>
	}

	let trimmedQuery = searchQuery.trim()
	let parts = content.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi"))

	let highlightedContent = parts
		.map((part: string) => {
			let isMatch = part.toLowerCase() === trimmedQuery.toLowerCase()
			return isMatch
				? `<mark class="bg-yellow-200 text-yellow-900">${part}</mark>`
				: part
		})
		.join("")

	return <Markdown>{highlightedContent}</Markdown>
}

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function Pinned(props: { pinned?: boolean }) {
	if (!props.pinned) return null
	return (
		<Badge>
			<PinFill />
			<span>
				<T k="note.status.pinned" />
			</span>
		</Badge>
	)
}

function TimeStamp({
	record,
}: {
	record: {
		createdAt?: Date
		updatedAt?: Date
		$jazz: {
			createdAt: number
			lastUpdatedAt: number
		}
	}
}) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined
	let createdText = formatDistanceToNow(
		record.createdAt || new Date(record.$jazz.createdAt),
		{
			addSuffix: true,
			locale: dfnsLocale,
		},
	)
	let updatedText = formatDistanceToNow(
		record.updatedAt || new Date(record.$jazz.lastUpdatedAt),
		{
			addSuffix: true,
			locale: dfnsLocale,
		},
	)

	let shouldShowUpdated =
		(record.updatedAt || new Date(record.$jazz.lastUpdatedAt)).getTime() !==
		(record.createdAt || new Date(record.$jazz.createdAt)).getTime()

	let t = useIntl()
	return (
		<div className="text-muted-foreground text-xs">
			{createdText}
			{shouldShowUpdated &&
				t("note.timestamp.editedSuffix", { ago: updatedText })}
		</div>
	)
}

function ActionsDialog(props: {
	open: boolean
	onOpenChange: (open: boolean) => void

	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>

	onEdit: () => void
	onDelete: () => void
	onPin: () => void
}) {
	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="note.actions.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="note.actions.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-3">
					<Button className="h-12 w-full" onClick={props.onEdit}>
						<PencilSquare />
						<T k="note.actions.edit" />
					</Button>
					<div className="flex items-center gap-3">
						<Button
							variant="destructive"
							className="h-12 flex-1"
							onClick={props.onDelete}
						>
							<Trash />
							<T k="note.actions.delete" />
						</Button>
						<Button
							variant="secondary"
							className="h-12 flex-1"
							onClick={props.onPin}
						>
							<PinFill />
							{props.note.pinned ? (
								<T k="note.actions.unpin" />
							) : (
								<T k="note.actions.pin" />
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function EditDialog(props: {
	open: boolean
	onOpenChange: (open: boolean) => void
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
}) {
	let t = useIntl()
	async function handleSubmit(data: { content: string; pinned: boolean }) {
		let result = await editNote(
			data,
			props.person.$jazz.id,
			props.note.$jazz.id,
			t,
		)
		if (result?.success) {
			props.onOpenChange(false)
		}
	}

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="note.actions.edit" />
						</DialogTitle>
						<DialogDescription>
							<T k="note.actions.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<NoteForm
					defaultValues={{
						content: props.note.content,
						pinned: props.note.pinned || false,
					}}
					onSubmit={handleSubmit}
					onCancel={() => props.onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}

function useContentOverflow(content: string, isExpanded: boolean) {
	let contentRef = useRef<HTMLDivElement>(null)
	let [hasOverflow, setHasOverflow] = useState(false)

	useEffect(() => {
		if (!contentRef.current) return
		let element = contentRef.current

		// Always check if content would overflow when collapsed
		let wasExpanded = !element.classList.contains("line-clamp-2")
		element.classList.add("line-clamp-2")

		let isOverflowing = element.scrollHeight > element.clientHeight

		// Restore the expanded state if it was expanded
		if (wasExpanded && isExpanded) {
			element.classList.remove("line-clamp-2")
		}

		setHasOverflow(isOverflowing)
	}, [content, isExpanded])

	return { contentRef, hasOverflow }
}

async function editNote(
	data: Partial<{ content: string; pinned: boolean }>,
	personId: string,
	noteId: string,
	t: ReturnType<typeof useIntl>,
) {
	let result = await tryCatch(updateNote(personId, noteId, data))
	if (!result.ok) {
		toast.error(
			typeof result.error === "string" ? result.error : result.error.message,
		)
		return
	}

	toast.success(t("note.toast.updated"), {
		action: {
			label: "Undo",
			onClick: async () => {
				let undoResult = await tryCatch(
					updateNote(personId, noteId, result.data.previous),
				)
				if (undoResult.ok) {
					toast.success(t("note.toast.updateUndone"))
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

async function deleteNote(
	personId: string,
	noteId: string,
	t: ReturnType<typeof useIntl>,
) {
	let result = await tryCatch(
		updateNote(personId, noteId, { deletedAt: new Date() }),
	)
	if (!result.ok) {
		toast.error(
			typeof result.error === "string" ? result.error : result.error.message,
		)
		return
	}

	toast.success(t("note.toast.deleted"))
}

async function pinOrUnpinNote(
	personId: string,
	noteId: string,
	t: ReturnType<typeof useIntl>,
	currentPinned?: boolean,
) {
	let result = await tryCatch(
		updateNote(personId, noteId, { pinned: !currentPinned }),
	)
	if (!result.ok) {
		toast.error(
			typeof result.error === "string" ? result.error : result.error.message,
		)
		return
	}

	toast.success(
		currentPinned ? t("note.toast.unpinned") : t("note.toast.pinned"),
	)
}

type MarkdownWithHighlightProps = {
	content: string
	searchQuery?: string
}

function RestoreNoteDialog({
	note,
	person,
	open,
	onOpenChange,
}: {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	let t = useIntl()
	let [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

	let deletionInfo = null
	if (note.deletedAt) {
		let daysSinceDeletion = differenceInDays(new Date(), note.deletedAt)
		let daysUntilPermanentDeletion = Math.max(0, 30 - daysSinceDeletion)
		deletionInfo = {
			daysSinceDeletion,
			daysUntilPermanentDeletion,
			isDueForPermanentDeletion: daysSinceDeletion >= 30,
		}
	}

	async function handleRestore() {
		let result = await tryCatch(
			updateNote(person.$jazz.id, note.$jazz.id, { deletedAt: undefined }),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("note.toast.restored"))
		onOpenChange(false)
	}

	async function handlePermanentDelete() {
		let result = await tryCatch(
			updateNote(person.$jazz.id, note.$jazz.id, {
				permanentlyDeletedAt: new Date(),
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("note.toast.permanentlyDeleted"))
		onOpenChange(false)
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="note.restore.title" />
							</DialogTitle>
							<DialogDescription>
								<T
									k="note.restore.deletionInfo"
									params={{
										timeAgo: formatDistanceToNow(
											note.deletedAt ||
												note.updatedAt ||
												note.createdAt ||
												new Date(
													note.$jazz.lastUpdatedAt || note.$jazz.createdAt,
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
												<T k="note.restore.permanentDeletionWarning" />
											</span>
										) : (
											<T
												k="note.restore.permanentDeletionCountdown"
												params={{
													days: deletionInfo.daysUntilPermanentDeletion,
												}}
											/>
										)}
									</>
								)}
								<T k="note.restore.question" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-3">
						<Button className="h-12 w-full" onClick={handleRestore}>
							<T k="note.restore.button" />
						</Button>
						<Button
							variant="destructive"
							className="h-12 w-full"
							onClick={() => setConfirmDeleteOpen(true)}
						>
							<T k="note.restore.permanentDelete" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<T k="note.permanentDelete.title" />
						</AlertDialogTitle>
						<AlertDialogDescription>
							<T k="note.permanentDelete.confirmation" />
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<T k="note.permanentDelete.cancel" />
						</AlertDialogCancel>
						<AlertDialogAction onClick={handlePermanentDelete}>
							<T k="note.permanentDelete.confirm" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
