import { Note, Person, isDueToday, isDeleted } from "#shared/schema/user"
import { co } from "jazz-tools"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale } from "#shared/intl/setup"
import { cn } from "#app/lib/utils"
import { PinFill, Trash } from "react-bootstrap-icons"
import { TextHighlight } from "#shared/ui/text-highlight"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage, useCoState } from "jazz-tools/react"
import { T } from "#shared/intl/setup"
import { SharedIndicator } from "#app/components/shared-indicator"
import { Link } from "@tanstack/react-router"
import {
	CollapsibleContent,
	contentHasOverflow,
} from "#app/components/collapsible-content"
import { MarkdownWithHighlight } from "#app/components/markdown-with-highlight"

export {
	ActiveNoteListItem,
	DeletedNoteListItem,
	NoteImageGrid,
	contentHasOverflow,
}

type NoteListItemProps = {
	note: co.loaded<typeof Note>
	person: co.loaded<typeof Person>
	content: string
	isExpanded: boolean
	hasOverflow: boolean
	searchQuery?: string
	hidePerson?: boolean
}

function ActiveNoteListItem({
	note,
	person,
	content,
	isExpanded,
	hasOverflow,
	searchQuery,
	hidePerson,
}: NoteListItemProps) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let createdText = formatDistanceToNow(
		note.createdAt || new Date(note.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	let hasDueReminders =
		!hidePerson && person.reminders?.$isLoaded
			? Array.from(person.reminders.values())
					.filter(
						(r): r is typeof r & { $isLoaded: true } =>
							r != null && r.$isLoaded,
					)
					.filter(r => !isDeleted(r) && r.done !== true)
					.some(r => isDueToday(r))
			: false

	let personLink = !hidePerson
		? {
				to: "/people/$personID" as const,
				params: { personID: person.$jazz.id },
			}
		: undefined

	return (
		<div
			className={cn(
				"flex w-full items-start gap-3 text-left",
				hidePerson ? "py-2" : "py-4",
			)}
		>
			{personLink && (
				<Link
					{...personLink}
					onClick={e => e.stopPropagation()}
					draggable={false}
				>
					<Avatar className="size-16">
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
				</Link>
			)}
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center gap-3" data-selectable>
					{personLink && (
						<Link
							{...personLink}
							onClick={e => e.stopPropagation()}
							draggable={false}
							className="text-muted-foreground line-clamp-1 text-left text-sm"
						>
							<TextHighlight text={person.name} query={searchQuery} />
						</Link>
					)}
					{hasDueReminders && (
						<div className="bg-primary size-2 rounded-full" />
					)}
					<SharedIndicator item={note} />
					{note.pinned && (
						<div>
							<PinFill className="text-primary size-3" />
							<span className="sr-only">
								<T k="note.status.pinned" />
							</span>
						</div>
					)}
					<div className="flex-1" />
					<div className="text-muted-foreground text-xs">{createdText}</div>
				</div>
				<CollapsibleContent isExpanded={isExpanded} hasOverflow={hasOverflow}>
					<div className="text-left text-wrap" data-selectable>
						<MarkdownWithHighlight
							content={content}
							searchQuery={searchQuery}
						/>
					</div>
				</CollapsibleContent>
			</div>
		</div>
	)
}

function DeletedNoteListItem({
	note,
	person,
	content,
	isExpanded,
	hasOverflow,
	searchQuery,
	hidePerson,
}: NoteListItemProps) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let deletedText = formatDistanceToNow(
		note.deletedAt ??
			new Date(note.$jazz.lastUpdatedAt || note.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	let personLink = !hidePerson
		? {
				to: "/people/$personID" as const,
				params: { personID: person.$jazz.id },
			}
		: undefined

	return (
		<div
			className={cn(
				"flex w-full items-start gap-3 text-left",
				hidePerson ? "py-2" : "py-4",
			)}
		>
			{personLink && (
				<Link
					{...personLink}
					onClick={e => e.stopPropagation()}
					draggable={false}
				>
					<Avatar className="size-16 grayscale">
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
				</Link>
			)}
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
					<span className="text-destructive inline-flex items-center gap-1 [&>svg]:size-3">
						<Trash />
						<span>{deletedText}</span>
					</span>
					{personLink && (
						<Link
							{...personLink}
							onClick={e => e.stopPropagation()}
							draggable={false}
							className="text-muted-foreground font-normal"
						>
							<TextHighlight text={person.name} query={searchQuery} />
						</Link>
					)}
				</div>
				<CollapsibleContent isExpanded={isExpanded} hasOverflow={hasOverflow}>
					<div
						className="text-muted-foreground text-left text-wrap"
						data-selectable
					>
						<MarkdownWithHighlight
							content={content}
							searchQuery={searchQuery}
						/>
					</div>
				</CollapsibleContent>
			</div>
		</div>
	)
}

// -- Images --

type ImageItem = co.loaded<ReturnType<typeof co.image>>

function NoteImageGrid({
	note,
	isDeleted: noteIsDeleted,
	onImageClick,
	hidePerson,
}: {
	note: co.loaded<typeof Note>
	isDeleted: boolean
	onImageClick: (index: number) => void
	hidePerson?: boolean
}) {
	let loadedNote = useCoState(Note, note.$jazz.id, {
		resolve: { images: { $each: true } },
	})

	let imageArray =
		loadedNote?.$isLoaded && loadedNote.images?.$isLoaded
			? Array.from(loadedNote.images.values()).filter(
					(img): img is ImageItem => img?.$isLoaded === true,
				)
			: []

	let imageCount = note.imageCount ?? imageArray.length

	if (imageCount === 0) return null

	return (
		<div
			className={cn(
				"grid grid-flow-col gap-1 pb-4",
				!hidePerson && "ml-[76px]",
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
							noteIsDeleted && "pointer-events-none",
							imageCount === 3 && index === 0
								? "col-span-1 row-span-2"
								: "aspect-[4/3] md:aspect-video",
						)}
						onClick={() => {
							if (!noteIsDeleted && image) onImageClick(index)
						}}
					>
						{image ? (
							<JazzImage
								imageId={image.$jazz.id}
								loading="lazy"
								alt=""
								className={cn(
									"size-full rounded-lg object-cover",
									noteIsDeleted && "grayscale",
								)}
							/>
						) : (
							<div className="bg-muted size-full animate-pulse rounded-lg motion-reduce:animate-none" />
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
	)
}
