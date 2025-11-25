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
import { Button } from "#shared/ui/button"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { co, type Loaded } from "jazz-tools"
import {
	PencilSquare,
	Trash,
	PinFill,
	PersonFill,
	ArrowCounterclockwise,
} from "react-bootstrap-icons"
import { useState, type ReactNode } from "react"
import { NoteForm } from "./note-form"
import { formatDistanceToNow } from "date-fns"
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
	let me = useAccount(UserAccount)
	let [openDialog, setOpenDialog] = useState<"actions" | "restore" | "edit">()
	let { isExpanded, toggleExpanded } = useExpanded(props.note.$jazz.id)
	let showPerson = props.showPerson ?? true
	let operations = useNoteItemOperations({
		note: props.note,
		person: props.person,
		me,
	})

	if (!me.$isLoaded) return null

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

	if (props.note.deletedAt) {
		return (
			<>
				<RestoreNoteDropdown
					open={openDialog === "restore"}
					onOpenChange={open => setOpenDialog(open ? "restore" : undefined)}
					operations={operations}
				>
					<NoteItemContainer
						note={props.note}
						person={props.person}
						showPerson={showPerson}
						hasOverflow={hasOverflow}
						className={openDialog ? "bg-accent" : ""}
						onClick={() => setOpenDialog("restore")}
					>
						<div className="flex items-center gap-3 select-text">
							<span className="text-destructive">
								<T k="note.status.deleted" />
							</span>
						</div>
						<div>
							<div className="text-muted-foreground text-left text-wrap select-text">
								<MarkdownWithHighlight
									content={displayContent}
									searchQuery={props.searchQuery}
								/>
							</div>
						</div>
					</NoteItemContainer>
				</RestoreNoteDropdown>
				{props.note.images && (
					<NoteImageGrid images={props.note.images} isDeleted={true} />
				)}
				{hasOverflow && (
					<ExpandCollapseButton
						isExpanded={isExpanded}
						toggleExpanded={toggleExpanded}
						showPerson={showPerson}
					/>
				)}
			</>
		)
	}

	return (
		<>
			<ActionsDropdown
				open={openDialog === "actions"}
				onOpenChange={open => setOpenDialog(open ? "actions" : undefined)}
				onEditClick={() => setOpenDialog("edit")}
				showPerson={showPerson}
				person={props.person}
				operations={operations}
			>
				<NoteItemContainer
					note={props.note}
					person={props.person}
					showPerson={showPerson}
					hasOverflow={hasOverflow}
					className={openDialog ? "bg-accent" : ""}
					onClick={() => setOpenDialog("actions")}
				>
					<div className="flex items-center gap-3 select-text">
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
					</div>
					<div>
						<div className="text-left text-wrap select-text">
							<MarkdownWithHighlight
								content={displayContent}
								searchQuery={props.searchQuery}
							/>
						</div>
					</div>
				</NoteItemContainer>
			</ActionsDropdown>
			{props.note.images && (
				<NoteImageGrid
					images={props.note.images}
					isDeleted={false}
					showPerson={showPerson}
				/>
			)}
			{hasOverflow && (
				<ExpandCollapseButton
					isExpanded={isExpanded}
					toggleExpanded={toggleExpanded}
					showPerson={showPerson}
				/>
			)}
			<EditDialog
				note={props.note}
				person={props.person}
				open={openDialog === "edit"}
				onOpenChange={() => setOpenDialog(undefined)}
				operations={operations}
			/>
		</>
	)
}

function NoteItemContainer({
	note,
	person,
	showPerson,
	hasOverflow,
	className,
	children,
	onClick,
}: {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	showPerson: boolean
	hasOverflow: boolean
	className?: string
	children: React.ReactNode
	onClick: (e: React.MouseEvent) => void
}) {
	let baseClassName = cn(
		"flex w-full cursor-pointer items-start gap-3 rounded-md py-4 text-left",
		hasOverflow && "pt-4 pb-0",
	)

	return (
		<div
			className={cn(
				className,
				"hover:bg-muted has-active:bg-accent -mx-3 rounded-md px-3",
			)}
		>
			<DropdownMenuTrigger
				id={`note-${note.$jazz.id}`}
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
				{showPerson && (
					<Avatar className={note.deletedAt ? "size-16 grayscale" : "size-16"}>
						{person.avatar ? (
							<JazzImage
								imageId={person.avatar.$jazz.id}
								loading="lazy"
								alt={person.name}
								width={64}
								data-slot="avatar-image"
								className="aspect-square size-full object-cover shadow-inner"
							/>
						) : (
							<AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
						)}
					</Avatar>
				)}
				<div className="min-w-0 flex-1 space-y-1">{children}</div>
			</DropdownMenuTrigger>
		</div>
	)
}

function ExpandCollapseButton({
	isExpanded,
	toggleExpanded,
	showPerson,
}: {
	isExpanded: boolean
	toggleExpanded: () => void
	showPerson: boolean
}) {
	return (
		<div
			className={cn("-mx-3 px-3 pb-4 text-right", showPerson && "ml-[76px]")}
		>
			<button
				onClick={toggleExpanded}
				className="text-muted-foreground -m-1 p-1 text-xs font-bold hover:underline"
			>
				{isExpanded ? <T k="note.showLess" /> : <T k="note.showMore" />}
			</button>
		</div>
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

function ActionsDropdown({
	open,
	onOpenChange,
	onEditClick,
	showPerson,
	person,
	operations,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onEditClick: () => void
	showPerson: boolean
	person: co.loaded<typeof Person>
	operations: NoteItemOperations
	children: ReactNode
}) {
	async function handleDelete() {
		onOpenChange(false)
		await operations.deleteNote()
	}

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange} modal>
			{children}
			<DropdownMenuContent align={"center"} side={"top"}>
				<DropdownMenuItem onClick={onEditClick}>
					<T k="note.actions.edit" />
					<PencilSquare />
				</DropdownMenuItem>
				{showPerson && (
					<DropdownMenuItem asChild>
						<Link
							to="/people/$personID"
							params={{ personID: person.$jazz.id }}
							onClick={() => onOpenChange(false)}
						>
							<T k="note.actions.viewPerson" />
							<PersonFill />
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem variant="destructive" onClick={handleDelete}>
					<T k="note.actions.delete" />
					<Trash />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function EditDialog(props: {
	open: boolean
	onOpenChange: (open: boolean) => void
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	operations: NoteItemOperations
}) {
	async function handleSubmit(data: {
		content: string
		pinned: boolean
		images?: File[]
		removedImageIds?: string[]
	}) {
		let result = await props.operations.editNote(data)
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
					note={props.note}
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

type MarkdownWithHighlightProps = {
	content: string
	searchQuery?: string
}

function RestoreNoteDropdown({
	open,
	onOpenChange,
	operations,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	operations: NoteItemOperations
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
						<T k="note.restore.button" />
						<ArrowCounterclockwise />
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setConfirmDeleteOpen(true)}
					>
						<T k="note.restore.permanentDelete" />
						<Trash />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

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

type NoteItemOperations = {
	editNote: (data: {
		content: string
		pinned: boolean
		images?: File[]
		removedImageIds?: string[]
	}) => Promise<{ success: true } | undefined>
	deleteNote: () => Promise<void>
	restore: () => Promise<boolean>
	deletePermanently: () => Promise<boolean>
}

function useNoteItemOperations({
	note,
	person,
	me,
}: {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	me: ReturnType<typeof useAccount<typeof UserAccount>>
}): NoteItemOperations {
	let t = useIntl()

	if (!me.$isLoaded) {
		throw new Error("useNoteItemOperations called with unloaded account")
	}
	let loadedMe: Loaded<typeof UserAccount> = me

	async function editNote(
		data: Partial<{
			content: string
			pinned: boolean
			images: File[]
			removedImageIds: string[]
		}>,
	): Promise<{ success: true } | undefined> {
		let result = await tryCatch(
			updateNote(
				{
					content: data.content,
					pinned: data.pinned,
					imageFiles: data.images,
					removedImageIds: data.removedImageIds,
				},
				{
					personId: person.$jazz.id,
					noteId: note.$jazz.id,
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

		toast.success(t("note.toast.updated"), {
			action: {
				label: "Undo",
				onClick: async () => {
					let undoResult = await tryCatch(
						updateNote(result.data.previous, {
							personId: person.$jazz.id,
							noteId: note.$jazz.id,
							worker: loadedMe,
						}),
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

	async function deleteNote() {
		let result = await tryCatch(
			updateNote(
				{ deletedAt: new Date() },
				{
					personId: person.$jazz.id,
					noteId: note.$jazz.id,
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

		toast.success(t("note.toast.deleted"))
	}

	async function restore(): Promise<boolean> {
		let result = await tryCatch(
			updateNote(
				{ deletedAt: undefined },
				{
					personId: person.$jazz.id,
					noteId: note.$jazz.id,
					worker: loadedMe,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return false
		}

		toast.success(t("note.toast.restored"))
		return true
	}

	async function deletePermanently(): Promise<boolean> {
		let result = await tryCatch(
			updateNote(
				{ permanentlyDeletedAt: new Date() },
				{
					personId: person.$jazz.id,
					noteId: note.$jazz.id,
					worker: loadedMe,
				},
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return false
		}

		toast.success(t("note.toast.permanentlyDeleted"))
		return true
	}

	return {
		editNote,
		deleteNote,
		restore,
		deletePermanently,
	}
}

let expandedNoteIDs = new Set<string>()

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

function NoteImageGrid({
	images,
	isDeleted,
	showPerson,
}: {
	images: co.loaded<typeof Note>["images"]
	isDeleted: boolean
	showPerson?: boolean
}) {
	let [selectedImageIndex, setSelectedImageIndex] = useState<number>()

	if (!images?.$isLoaded) return null

	let imageArray = Array.from(images.values()).filter(
		(img): img is ImageItem => img?.$isLoaded === true,
	)
	let imageCount = imageArray.length

	if (imageCount === 0) return null

	let gridClass =
		imageCount === 1
			? "grid-cols-1"
			: imageCount === 2
				? "grid-cols-2"
				: imageCount === 3
					? "grid-cols-3"
					: "grid-cols-2"

	return (
		<>
			<div
				className={cn(
					"grid gap-1",
					gridClass,
					showPerson && "-mx-3 ml-[76px] px-3",
				)}
			>
				{imageArray.slice(0, 4).map((image, index) => (
					<div
						key={index}
						className={cn(
							"relative cursor-pointer",
							imageCount === 3 && index === 0 && "col-span-3",
							isDeleted && "pointer-events-none",
						)}
						onClick={() => !isDeleted && setSelectedImageIndex(index)}
					>
						<JazzImage
							imageId={image.$jazz.id}
							loading="lazy"
							alt=""
							className={cn(
								"h-24 w-full rounded-lg object-cover",
								isDeleted && "grayscale",
							)}
						/>
						{imageCount > 4 && index === 3 && (
							<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-2xl font-bold text-white">
								+{imageCount - 4}
							</div>
						)}
					</div>
				))}
			</div>
			{!isDeleted && selectedImageIndex !== undefined && (
				<ImageViewerDialog
					images={imageArray}
					selectedIndex={selectedImageIndex}
					onClose={() => setSelectedImageIndex(undefined)}
					onNavigate={setSelectedImageIndex}
				/>
			)}
		</>
	)
}

type ImageItem = co.loaded<ReturnType<typeof co.image>>

function ImageViewerDialog({
	images,
	selectedIndex,
	onClose,
	onNavigate,
}: {
	images: ImageItem[]
	selectedIndex: number
	onClose: () => void
	onNavigate: (index: number) => void
}) {
	let currentImage = images[selectedIndex]
	if (!currentImage) return null

	function handlePrevious() {
		if (selectedIndex > 0) {
			onNavigate(selectedIndex - 1)
		}
	}

	function handleNext() {
		if (selectedIndex < images.length - 1) {
			onNavigate(selectedIndex + 1)
		}
	}

	return (
		<Dialog open={true} onOpenChange={open => !open && onClose()}>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							{selectedIndex + 1} / {images.length}
						</DialogTitle>
					</DialogHeader>
				}
				className="max-w-4xl"
			>
				<div className="flex items-center justify-center">
					<JazzImage
						imageId={currentImage.$jazz.id}
						alt=""
						className="max-h-[70vh] w-auto rounded-lg object-contain"
					/>
				</div>
				{images.length > 1 && (
					<div className="flex justify-center gap-2">
						<Button
							onClick={handlePrevious}
							disabled={selectedIndex === 0}
							variant="secondary"
						>
							Previous
						</Button>
						<Button
							onClick={handleNext}
							disabled={selectedIndex === images.length - 1}
							variant="secondary"
						>
							Next
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
