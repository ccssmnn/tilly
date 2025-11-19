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
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { co } from "jazz-tools"
import { PencilSquare, Trash, PinFill, PersonFill } from "react-bootstrap-icons"
import { useState } from "react"
import { NoteForm } from "./note-form"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { cn, isTextSelectionOngoing } from "#app/lib/utils"
import { toast } from "sonner"
import { updateNote } from "#shared/tools/note-update"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { de as dfnsDe } from "date-fns/locale"
import { Markdown } from "#shared/ui/markdown"
import { Image as JazzImage, useAccount } from "jazz-tools/react"
import { Link } from "@tanstack/react-router"
import { TextHighlight } from "#shared/ui/text-highlight"

export { NoteListItem }

let CHAR_LIMIT = 280
let LINE_LIMIT = 4

function NoteListItem(props: {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	searchQuery?: string
	showPerson?: boolean
}) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [openDialog, setOpenDialog] = useState<"actions" | "restore" | "edit">()
	let { isExpanded, toggleExpanded } = useExpanded(props.note.$jazz.id)
	let showPerson = props.showPerson ?? true

	let lines = props.note.content.split("\n")
	let hasCharOverflow = props.note.content.length > CHAR_LIMIT
	let hasLineOverflow = lines.length > LINE_LIMIT
	let hasOverflow = hasCharOverflow || hasLineOverflow

	let displayContent = props.note.content
	if (!isExpanded && hasOverflow) {
		if (hasLineOverflow) {
			displayContent = lines.slice(0, LINE_LIMIT).join("\n") + "..."
		}
		if (hasCharOverflow && displayContent.length > CHAR_LIMIT) {
			displayContent = displayContent.slice(0, CHAR_LIMIT) + "..."
		}
	}

	return (
		<>
			<div
				className={cn(
					openDialog !== undefined && "bg-accent",
					"hover:bg-muted has-active:bg-accent -mx-3 rounded-md px-3",
				)}
			>
				<button
					id={`note-${props.note.$jazz.id}`}
					onClick={() => {
						if (isTextSelectionOngoing()) return
						setOpenDialog(props.note.deletedAt ? "restore" : "actions")
					}}
					className={cn(
						"flex w-full cursor-pointer items-start gap-3 rounded-md py-4 text-left",
						hasOverflow && "pt-4 pb-0",
					)}
				>
					{showPerson && (
						<Avatar
							className={props.note.deletedAt ? "size-16 grayscale" : "size-16"}
						>
							{props.person.avatar ? (
								<JazzImage
									imageId={props.person.avatar.$jazz.id}
									loading="lazy"
									alt={props.person.name}
									width={64}
									data-slot="avatar-image"
									className="aspect-square size-full object-cover shadow-inner"
								/>
							) : (
								<AvatarFallback>{props.person.name.slice(0, 1)}</AvatarFallback>
							)}
						</Avatar>
					)}
					<div className="min-w-0 flex-1 space-y-1">
						<div className="flex items-center gap-3 select-text">
							{props.note.deletedAt ? (
								<span className="text-destructive">
									<T k="note.status.deleted" />
								</span>
							) : (
								<>
									{showPerson && (
										<p className="text-muted-foreground line-clamp-1 text-left text-sm">
											<TextHighlight
												text={props.person.name}
												query={props.searchQuery}
											/>
										</p>
									)}
									<Pinned pinned={props.note.pinned} />
									<div className="flex-1" />
									<TimeStamp record={props.note} />
								</>
							)}
						</div>
						<div>
							<div
								className={cn(
									"text-left text-wrap select-text",
									props.note.deletedAt && "text-muted-foreground",
								)}
							>
								<MarkdownWithHighlight
									content={displayContent}
									searchQuery={props.searchQuery}
								/>
							</div>
						</div>
					</div>
				</button>
				<div
					className={cn(
						"hidden pb-4 text-right data-[overflow=true]:block",
						showPerson && "ml-[76px]",
					)}
					data-overflow={hasOverflow}
				>
					<button
						onClick={toggleExpanded}
						className="text-muted-foreground -m-1 p-1 text-xs font-bold hover:underline"
					>
						{isExpanded ? <T k="note.showLess" /> : <T k="note.showMore" />}
					</button>
				</div>
			</div>
			<ActionsDialog
				note={props.note}
				person={props.person}
				showPerson={showPerson}
				open={openDialog === "actions"}
				onOpenChange={() => setOpenDialog(undefined)}
				onDelete={async () => {
					if (!me.$isLoaded) return
					await deleteNote(
						{
							personId: props.person.$jazz.id,
							noteId: props.note.$jazz.id,
							worker: me,
						},
						t,
					)
					setOpenDialog(undefined)
				}}
				onEdit={() => setOpenDialog("edit")}
				onPin={async () => {
					if (!me.$isLoaded) return
					await pinOrUnpinNote(
						{
							personId: props.person.$jazz.id,
							noteId: props.note.$jazz.id,
							worker: me,
						},
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

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function Pinned(props: { pinned?: boolean }) {
	if (!props.pinned) return null
	return (
		<div>
			<PinFill className="text-primary size-3" />
			<span className="sr-only">
				<T k="note.status.pinned" />
			</span>
		</div>
	)
}

function TimeStamp({
	record,
}: {
	record: {
		createdAt?: Date
		$jazz: {
			createdAt: number
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

	return <div className="text-muted-foreground text-xs">{createdText}</div>
}

function ActionsDialog(props: {
	open: boolean
	onOpenChange: (open: boolean) => void

	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	showPerson: boolean

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
						{props.showPerson && (
							<Button
								variant="outline"
								className="h-12 flex-1"
								onClick={() => props.onOpenChange(false)}
								asChild
							>
								<Link
									to="/people/$personID"
									params={{ personID: props.person.$jazz.id }}
								>
									<PersonFill />
									<T k="note.actions.viewPerson" />
								</Link>
							</Button>
						)}
						<Button
							variant="destructive"
							className={cn(
								"h-12 flex-1",
								props.showPerson && "max-w-[calc(50%-6px)]",
							)}
							onClick={props.onDelete}
						>
							<Trash />
							<T k="note.actions.delete" />
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
	let me = useAccount(UserAccount)
	async function handleSubmit(data: { content: string; pinned: boolean }) {
		if (!me.$isLoaded) return
		let result = await editNote(
			data,
			{
				personId: props.person.$jazz.id,
				noteId: props.note.$jazz.id,
				worker: me,
			},
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
						createdAt: props.note.createdAt
							? new Date(props.note.createdAt).toISOString().slice(0, 10)
							: new Date(props.note.$jazz.createdAt).toISOString().slice(0, 10),
					}}
					onSubmit={handleSubmit}
					onCancel={() => props.onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}

async function editNote(
	data: Partial<{ content: string; pinned: boolean }>,
	options: {
		personId: string
		noteId: string
		worker: co.loaded<typeof UserAccount>
	},
	t: ReturnType<typeof useIntl>,
) {
	let result = await tryCatch(updateNote(data, options))
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
					updateNote(result.data.previous, options),
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
	options: {
		personId: string
		noteId: string
		worker: co.loaded<typeof UserAccount>
	},
	t: ReturnType<typeof useIntl>,
) {
	let result = await tryCatch(updateNote({ deletedAt: new Date() }, options))
	if (!result.ok) {
		toast.error(
			typeof result.error === "string" ? result.error : result.error.message,
		)
		return
	}

	toast.success(t("note.toast.deleted"))
}

async function pinOrUnpinNote(
	options: {
		personId: string
		noteId: string
		worker: co.loaded<typeof UserAccount>
	},
	t: ReturnType<typeof useIntl>,
	currentPinned?: boolean,
) {
	let result = await tryCatch(updateNote({ pinned: !currentPinned }, options))
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
	let me = useAccount(UserAccount)
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
		if (!me.$isLoaded) return
		let result = await tryCatch(
			updateNote(
				{ deletedAt: undefined },
				{
					personId: person.$jazz.id,
					noteId: note.$jazz.id,
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

		toast.success(t("note.toast.restored"))
		onOpenChange(false)
	}

	async function handlePermanentDelete() {
		if (!me.$isLoaded) return
		let result = await tryCatch(
			updateNote(
				{
					permanentlyDeletedAt: new Date(),
				},
				{
					personId: person.$jazz.id,
					noteId: note.$jazz.id,
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

let expandedNoteIDs = new Set<string>()

/**
 * we need this hook to remember which notes have been expanded even when
 * unmounted. otherwise the list virtualization gets messed up
 */
function useExpanded(id: string) {
	let [isExpanded, setIsExpanded] = useState(() => expandedNoteIDs.has(id))
	function toggleExpanded() {
		if (isExpanded) {
			setIsExpanded(false)
			expandedNoteIDs.delete(id)
		} else {
			setIsExpanded(true)
			expandedNoteIDs.add(id)
		}
	}

	return { isExpanded, toggleExpanded }
}
