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
import { Markdown } from "#shared/ui/markdown"
import { T } from "#shared/intl/setup"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { SharedIndicator } from "#app/features/person-shared-indicator"

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
}

function ActiveNoteListItem({
	note,
	person,
	content,
	isExpanded,
	hasOverflow,
	searchQuery,
}: NoteListItemProps) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let createdText = formatDistanceToNow(
		note.createdAt || new Date(note.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	let hasDueReminders = person.reminders?.$isLoaded
		? Array.from(person.reminders.values())
				.filter(
					(r): r is typeof r & { $isLoaded: true } => r != null && r.$isLoaded,
				)
				.filter(r => !isDeleted(r) && r.done !== true)
				.some(r => isDueToday(r))
		: false

	return (
		<div className="flex w-full items-start gap-3 py-4 text-left">
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
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center gap-3" data-selectable>
					<p className="text-muted-foreground line-clamp-1 text-left text-sm">
						<TextHighlight text={person.name} query={searchQuery} />
					</p>
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
}: NoteListItemProps) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let deletedText = formatDistanceToNow(
		note.deletedAt ??
			new Date(note.$jazz.lastUpdatedAt || note.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	return (
		<div className="flex w-full items-start gap-3 py-4 text-left">
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
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
					<span className="text-destructive inline-flex items-center gap-1 [&>svg]:size-3">
						<Trash />
						<span>{deletedText}</span>
					</span>
					<span className="text-muted-foreground font-normal">
						<TextHighlight text={person.name} query={searchQuery} />
					</span>
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

// -- Expand / Collapse --

let COLLAPSED_HEIGHT = 96 // ~4 lines at default line-height
let CHAR_LIMIT = 280
let LINE_LIMIT = 4

function contentHasOverflow(content: string): boolean {
	let lines = content.split("\n")
	return content.length > CHAR_LIMIT || lines.length > LINE_LIMIT
}

function CollapsibleContent({
	isExpanded,
	hasOverflow,
	children,
}: {
	isExpanded: boolean
	hasOverflow: boolean
	children: ReactNode
}) {
	let innerRef = useRef<HTMLDivElement>(null)
	let [expandedHeight, setExpandedHeight] = useState(COLLAPSED_HEIGHT)

	useEffect(() => {
		if (!hasOverflow) return

		function updateHeight() {
			let nextHeight = innerRef.current?.scrollHeight ?? COLLAPSED_HEIGHT
			setExpandedHeight(nextHeight)
		}

		updateHeight()

		let element = innerRef.current
		if (!element || typeof ResizeObserver === "undefined") return

		let observer = new ResizeObserver(() => updateHeight())
		observer.observe(element)

		return () => observer.disconnect()
	}, [children, hasOverflow])

	if (!hasOverflow) return children

	return (
		<div
			className={cn(
				"overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none",
				!isExpanded &&
					"[mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]",
			)}
			style={{ maxHeight: isExpanded ? expandedHeight : COLLAPSED_HEIGHT }}
		>
			<div ref={innerRef}>{children}</div>
		</div>
	)
}

// -- Images --

type ImageItem = co.loaded<ReturnType<typeof co.image>>

function NoteImageGrid({
	note,
	isDeleted: noteIsDeleted,
	onImageClick,
}: {
	note: co.loaded<typeof Note>
	isDeleted: boolean
	onImageClick: (index: number) => void
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

	return (
		<div
			className={cn(
				"ml-[76px] grid grid-flow-col gap-1 pb-4",
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

// -- Markdown --

function MarkdownWithHighlight({
	content,
	searchQuery,
}: {
	content: string
	searchQuery?: string
}) {
	if (!searchQuery?.trim()) {
		return <Markdown>{content}</Markdown>
	}

	let terms = extractSearchTerms(searchQuery.trim())
	if (terms.length === 0) {
		return <Markdown>{content}</Markdown>
	}

	let pattern = terms.map(escapeRegExp).join("|")
	let parts = content.split(new RegExp(`(${pattern})`, "gi"))
	let highlighted = parts
		.map(part => {
			let isMatch = terms.some(
				term => part.toLowerCase() === term.toLowerCase(),
			)
			return isMatch
				? `<mark class="bg-yellow-200 text-yellow-900">${part}</mark>`
				: part
		})
		.join("")

	return <Markdown>{highlighted}</Markdown>
}

function extractSearchTerms(query: string): string[] {
	let terms: string[] = []
	let hashtagMatch = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (hashtagMatch) terms.push(hashtagMatch[1])
	let rest = query.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (rest) terms.push(rest)
	return terms
}

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
