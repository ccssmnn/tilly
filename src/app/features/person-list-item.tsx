import { Image as JazzImage, useAccount } from "jazz-tools/react"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { isDueToday, isDeleted, UserAccount } from "#shared/schema/user"
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
import { updatePerson } from "#shared/tools/person-update"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { useState, type ReactNode } from "react"
import { differenceInDays } from "date-fns"
import { T, useLocale, useIntl } from "#shared/intl/setup"
import type { LoadedPerson } from "#app/features/person-query"

export { PersonListItem }
export type { PersonListItemPerson }

type PersonListItemPerson = LoadedPerson

type PersonListItemProps = {
	person: PersonListItemPerson
	searchQuery?: string
	noLazy?: boolean
}

function PersonListItem({
	person,
	searchQuery,
	noLazy = false,
}: PersonListItemProps) {
	if (person.deletedAt) {
		return (
			<RestorePersonDialog person={person}>
				<div className="items-top hover:bg-muted active:bg-accent -mx-3 flex flex-1 cursor-pointer gap-3 rounded-lg px-3 py-4 transition-colors duration-150">
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
		)
	}

	return (
		<Link
			to="/people/$personID"
			params={{ personID: person.$jazz.id }}
			className="items-top hover:bg-muted active:bg-accent -mx-3 flex flex-1 gap-3 rounded-lg px-3 py-4 transition-colors duration-150"
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
			<p className={nameColor}>
				<TextHighlight text={person.name} query={searchQuery} />
			</p>
			<div className="flex items-center gap-1.5">
				{hasDueReminders && <div className="bg-primary size-2 rounded-full" />}
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

	return (
		<p
			className="text-muted-foreground mt-2 line-clamp-2 text-sm select-text"
			onMouseDown={e => e.stopPropagation()}
		>
			<TextHighlight text={person.summary} query={searchQuery} />
		</p>
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
