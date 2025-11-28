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
import { Note, Person, UserAccount } from "#shared/schema/user"
import { co, type Loaded } from "jazz-tools"
import {
	PencilSquare,
	Trash,
	PinFill,
	PersonFill,
	ArrowCounterclockwise,
	ChevronLeft,
	ChevronRight,
} from "react-bootstrap-icons"
import { useState, useEffect, type ReactNode } from "react"
import { NoteForm } from "./note-form"
import { formatDistanceToNow } from "date-fns"
import { cn, isTextSelectionOngoing } from "#app/lib/utils"
import { toast } from "sonner"
import { updateNote } from "#shared/tools/note-update"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { de as dfnsDe } from "date-fns/locale"
import { Markdown } from "#shared/ui/markdown"
import { Image as JazzImage, useAccount, useCoState } from "jazz-tools/react"
import { Link } from "@tanstack/react-router"
import { TextHighlight } from "#shared/ui/text-highlight"
import { Button } from "#shared/ui/button"
import { motion, AnimatePresence } from "motion/react"
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
				{hasOverflow && (
					<ExpandCollapseButton
						isExpanded={isExpanded}
						toggleExpanded={toggleExpanded}
						showPerson={showPerson}
					/>
				)}
				<NoteImageGrid note={props.note} isDeleted={true} />
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
			{hasOverflow && (
				<ExpandCollapseButton
					isExpanded={isExpanded}
					toggleExpanded={toggleExpanded}
					showPerson={showPerson}
				/>
			)}
			<NoteImageGrid
				note={props.note}
				isDeleted={false}
				showPerson={showPerson}
			/>
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
	note,
	isDeleted,
	showPerson,
}: {
	note: co.loaded<typeof Note>
	isDeleted: boolean
	showPerson?: boolean
}) {
	let [carouselOpen, setCarouselOpen] = useState(false)
	let [selectedImageIndex, setSelectedImageIndex] = useState<number>()

	let imageCount = note.imageCount ?? 0

	let loadedNote = useCoState(Note, note.$jazz.id, {
		resolve: { images: { $each: true } },
	})

	if (imageCount === 0) return null

	let imageArray =
		loadedNote?.$isLoaded && loadedNote.images?.$isLoaded
			? Array.from(loadedNote.images.values()).filter(
					(img): img is ImageItem => img?.$isLoaded === true,
				)
			: []

	return (
		<>
			<div
				className={cn(
					"grid grid-flow-col gap-1 pb-4",
					showPerson && "-mx-3 ml-[76px] pr-3",
					imageCount === 1 ? "grid-cols-1" : "grid-cols-2",
					imageCount > 2 ? "grid-rows-2" : "grid-rows-1",
				)}
			>
				{Array.from({ length: Math.min(imageCount, 4) }).map((_, index) => {
					let image = imageArray.at(index)
					return (
						<div
							key={index}
							className={cn(
								"relative cursor-pointer overflow-hidden",
								isDeleted && "pointer-events-none",
								imageCount === 3 && index === 0
									? "col-span-1 row-span-2"
									: "aspect-4/3 md:aspect-video",
							)}
							onClick={() => {
								if (!isDeleted && image) {
									setSelectedImageIndex(index)
									setCarouselOpen(true)
								}
							}}
						>
							{image ? (
								<JazzImage
									imageId={image.$jazz.id}
									loading="lazy"
									alt=""
									className={cn(
										"size-full rounded-lg object-cover",
										isDeleted && "grayscale",
									)}
								/>
							) : (
								<div className="bg-muted size-full animate-pulse rounded-lg" />
							)}
							{imageCount > 4 && index === 3 && (
								<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-2xl font-bold text-white">
									+{imageCount - 4}
								</div>
							)}
						</div>
					)
				})}
			</div>
			<ImageCarousel
				images={imageArray}
				selectedIndex={selectedImageIndex ?? 0}
				open={!isDeleted && carouselOpen && imageArray.length > 0}
				onClose={() => setCarouselOpen(false)}
			/>
		</>
	)
}

type ImageItem = co.loaded<ReturnType<typeof co.image>>
type Direction = "left" | "right" | undefined

function ImageCarousel({
	images,
	selectedIndex,
	open,
	onClose,
}: {
	images: ImageItem[]
	selectedIndex: number
	open: boolean
	onClose: () => void
}) {
	let [currentIndex, setCurrentIndex] = useState(selectedIndex)
	let [prevSelectedIndex, setPrevSelectedIndex] = useState(selectedIndex)
	if (selectedIndex !== prevSelectedIndex) {
		setPrevSelectedIndex(selectedIndex)
		setCurrentIndex(selectedIndex)
	}

	let [direction, setDirection] = useState<Direction>()

	function handlePrevious() {
		setDirection("left")
		setTimeout(
			() =>
				setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)),
			10,
		)
	}

	function handleNext() {
		setDirection("right")
		setTimeout(
			() =>
				setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)),
			10,
		)
	}

	function handleDotClick(index: number) {
		setDirection(index > currentIndex ? "right" : "left")
		setTimeout(() => setCurrentIndex(index), 10)
	}

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowRight") {
				handleNext()
			} else if (event.key === "ArrowLeft") {
				handlePrevious()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	})

	let currentImage = images[currentIndex]
	if (!currentImage) return null

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				titleSlot={<DialogTitle>Image viewer</DialogTitle>}
				className="h-[90dvh] md:w-[90dvw] md:max-w-none"
			>
				<div className="relative h-full w-full">
					<AnimatePresence mode="wait" custom={direction}>
						<motion.div
							key={currentIndex}
							custom={direction}
							initial="enter"
							animate="center"
							exit="exit"
							variants={{
								enter: (dir: Direction) => ({
									opacity: 0,
									x: { left: -12, right: 12, _: 0 }[dir ?? "_"],
								}),
								center: { opacity: 1, x: 0 },
								exit: (dir: Direction) => ({
									opacity: 0,
									x: { left: 12, right: -12, _: 0 }[dir ?? "_"],
								}),
							}}
							transition={{
								duration: 0.075,
							}}
							className="absolute inset-x-0 top-0 bottom-24 flex items-center justify-center"
						>
							<JazzImage
								imageId={currentImage.$jazz.id}
								alt=""
								className="max-h-full max-w-full rounded-lg object-contain"
							/>
						</motion.div>
					</AnimatePresence>

					{images.length > 1 && (
						<div className="absolute inset-x-0 bottom-0 flex h-24 items-center justify-center gap-4">
							<Button onClick={handlePrevious} size="sm" variant="secondary">
								<ChevronLeft />
								<T k="navigation.previous" />
							</Button>
							<div className="flex gap-2">
								{images.map((_, index) => (
									<button
										key={index}
										onClick={() => handleDotClick(index)}
										className={cn(
											"size-2 rounded-full transition-all",
											currentIndex === index
												? "bg-foreground w-6"
												: "bg-foreground/50 hover:bg-foreground/75",
										)}
									/>
								))}
							</div>
							<Button onClick={handleNext} variant="secondary">
								<T k="navigation.next" />
								<ChevronRight />
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
