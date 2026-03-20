import { Person, isDueToday, isDeleted } from "#shared/schema/user"
import { co } from "jazz-tools"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale } from "#shared/intl/setup"
import { TextHighlight } from "#shared/ui/text-highlight"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import { SharedIndicator } from "#app/components/shared-indicator"
import { Trash } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { Link } from "@tanstack/react-router"

export { ActivePersonListItem, DeletedPersonListItem }
export type { PersonListItemPerson }

type PersonListItemPerson = co.loaded<
	typeof Person,
	{
		avatar: true
		reminders: { $each: { $onError: "catch" } }
	}
>

type PersonListItemProps = {
	person: PersonListItemPerson
	searchQuery?: string
	noLazy?: boolean
}

function ActivePersonListItem({
	person,
	searchQuery,
	noLazy = false,
}: PersonListItemProps) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let hasDueReminders = false
	for (let reminder of person.reminders.values()) {
		if (!reminder?.$isLoaded) continue
		if (isDeleted(reminder) || reminder.done === true) continue
		if (isDueToday(reminder)) {
			hasDueReminders = true
			break
		}
	}

	let updatedText = formatDistanceToNow(
		person.updatedAt ||
			person.createdAt ||
			new Date(person.$jazz.lastUpdatedAt || person.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	let summaryParts = person.summary?.split(/(#[a-zA-Z0-9_]+)/)

	let personLink = {
		to: "/people/$personID" as const,
		params: { personID: person.$jazz.id },
	}

	return (
		<div className="items-top flex flex-1 gap-3 py-4">
			<Link {...personLink} onClick={e => e.stopPropagation()} draggable={false}>
				<Avatar className="size-16">
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
			</Link>
			<div className="flex-1">
				<div
					className="flex items-center justify-between leading-none select-text"
					onMouseDown={e => e.stopPropagation()}
				>
					<div className="flex items-center gap-1.5">
						<Link {...personLink} onClick={e => e.stopPropagation()} draggable={false} className="line-clamp-1 font-semibold">
							<TextHighlight text={person.name} query={searchQuery} />
						</Link>
						<SharedIndicator item={person} />
						{hasDueReminders && (
							<div className="bg-primary size-2 rounded-full" />
						)}
					</div>
					<p className="text-muted-foreground text-xs text-nowrap">
						{updatedText}
					</p>
				</div>
				{summaryParts && (
					<div
						className="mt-2 select-text"
						onMouseDown={e => e.stopPropagation()}
					>
						<p className="text-muted-foreground line-clamp-2 text-sm">
							{summaryParts.map((part, i) =>
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
				)}
			</div>
		</div>
	)
}

function DeletedPersonListItem({
	person,
	searchQuery,
	noLazy = false,
}: PersonListItemProps) {
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let deletedText = formatDistanceToNow(
		person.deletedAt ??
			person.updatedAt ??
			person.createdAt ??
			new Date(person.$jazz.lastUpdatedAt || person.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	let deletionDays = person.deletedAt
		? Math.max(0, 30 - differenceInDays(new Date(), person.deletedAt))
		: null

	let summaryParts = person.summary?.split(/(#[a-zA-Z0-9_]+)/)

	return (
		<div className="items-top flex flex-1 gap-3 py-4">
			<Avatar className="size-16 grayscale">
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
			<div className="flex-1">
				<div
					className="flex items-center justify-between leading-none select-text"
					onMouseDown={e => e.stopPropagation()}
				>
					<div className="flex items-center gap-1.5">
						<p className="text-destructive line-clamp-1 font-semibold">
							<TextHighlight text={person.name} query={searchQuery} />
						</p>
						<SharedIndicator item={person} />
					</div>
					<span className="text-destructive inline-flex items-center gap-1 text-xs [&>svg]:size-3">
						<Trash />
						<span>{deletedText}</span>
					</span>
				</div>
				{deletionDays !== null && (
					<p className="text-muted-foreground mt-1 text-xs">
						{deletionDays === 0 ? (
							<T k="person.restore.permanentDeletionWarning" />
						) : (
							<T
								k="person.restore.permanentDeletionCountdown"
								params={{ days: deletionDays }}
							/>
						)}
					</p>
				)}
				{summaryParts && (
					<div
						className="mt-2 select-text"
						onMouseDown={e => e.stopPropagation()}
					>
						<p className="text-muted-foreground line-clamp-2 text-sm">
							{summaryParts.map((part, i) =>
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
				)}
			</div>
		</div>
	)
}
