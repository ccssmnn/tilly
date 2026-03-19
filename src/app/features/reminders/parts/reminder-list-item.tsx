import { Person, Reminder } from "#shared/schema/user"
import { co } from "jazz-tools"
import { isBefore, isToday, formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale, useIntl } from "#shared/intl/setup"
import { cn } from "#app/lib/utils"
import { Calendar, ArrowRepeat, Trash, CheckLg } from "react-bootstrap-icons"
import { TextHighlight } from "#shared/ui/text-highlight"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"

export { ReminderListItem, DoneReminderListItem, DeletedReminderListItem }

type ReminderListItemProps = {
	reminder: co.loaded<typeof Reminder>
	person?: co.loaded<typeof Person>
	searchQuery?: string
}

type DoneReminderListItemProps = ReminderListItemProps & {
	referenceDate: Date
}

type DeletedReminderListItemProps = ReminderListItemProps & {
	deletedDate: Date
}

function ReminderListItem({
	reminder,
	person,
	searchQuery,
}: ReminderListItemProps) {
	let locale = useLocale()
	let isDue =
		isToday(new Date(reminder.dueAtDate)) ||
		isBefore(new Date(reminder.dueAtDate), new Date())

	return (
		<div className="flex w-full items-start gap-3 py-4 text-left">
			{person && (
				<div className="relative size-16">
					<Avatar className="size-full">
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
				</div>
			)}
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-start gap-3" data-selectable>
					<div
						className={cn(
							"inline-flex items-center gap-1 text-sm [&>svg]:size-3",
							isDue ? "text-destructive" : "text-foreground",
						)}
					>
						{reminder.repeat === undefined ? <Calendar /> : <ArrowRepeat />}
						{new Date(reminder.dueAtDate).toLocaleDateString(locale)}
					</div>
					{person && (
						<p className="text-muted-foreground line-clamp-1 text-left text-sm">
							<TextHighlight text={person.name} query={searchQuery} />
						</p>
					)}
				</div>
				<p className="text-md/tight text-left" data-selectable>
					<TextHighlight text={reminder.text} query={searchQuery} />
				</p>
			</div>
		</div>
	)
}

function DoneReminderListItem({
	reminder,
	person,
	searchQuery,
	referenceDate,
}: DoneReminderListItemProps) {
	let t = useIntl()
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let doneRelativeTime = formatDistanceToNow(referenceDate, {
		addSuffix: true,
		locale: dfnsLocale,
	})
	let doneLabel = t("reminder.status.done", { relativeTime: doneRelativeTime })

	return (
		<div className="flex w-full items-start gap-3 py-4 text-left">
			{person && (
				<div className="relative size-16">
					<Avatar className="size-full">
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
					<span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-emerald-400" />
				</div>
			)}
			<div className="min-w-0 flex-1 space-y-1">
				<div
					className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium"
					data-selectable
				>
					<span className="inline-flex items-center gap-1 text-emerald-500 [&>svg]:size-3">
						<CheckLg />
						<span>{doneLabel}</span>
					</span>
					{person && (
						<span className="text-muted-foreground font-normal">
							<TextHighlight text={person.name} query={searchQuery} />
						</span>
					)}
				</div>
				<p className="text-md/tight text-left" data-selectable>
					<TextHighlight text={reminder.text} query={searchQuery} />
				</p>
			</div>
		</div>
	)
}

function DeletedReminderListItem({
	reminder,
	person,
	searchQuery,
	deletedDate,
}: DeletedReminderListItemProps) {
	let t = useIntl()
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	let deletedRelativeTime = formatDistanceToNow(deletedDate, {
		addSuffix: true,
		locale: dfnsLocale,
	})
	let deletedLabel = t("reminder.status.deleted", {
		relativeTime: deletedRelativeTime,
	})

	return (
		<div className="flex w-full items-start gap-3 py-4 text-left">
			{person && (
				<div className="relative size-16">
					<Avatar className="size-full grayscale">
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
				</div>
			)}
			<div className="min-w-0 flex-1 space-y-1">
				<div
					className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium"
					data-selectable
				>
					<span className="text-destructive inline-flex items-center gap-1 [&>svg]:size-3">
						<Trash />
						<span>{deletedLabel}</span>
					</span>
					{person && (
						<span className="text-muted-foreground font-normal">
							<TextHighlight text={person.name} query={searchQuery} />
						</span>
					)}
				</div>
				<p className="text-md/tight text-left" data-selectable>
					<TextHighlight text={reminder.text} query={searchQuery} />
				</p>
			</div>
		</div>
	)
}
