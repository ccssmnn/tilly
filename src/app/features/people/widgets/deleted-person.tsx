import { useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl, T } from "#shared/intl/setup"
import {
	handleRestorePerson,
	handlePermanentlyDeletePerson,
} from "../lib/person-actions"
import {
	DeletedPersonListItem,
	type PersonListItemPerson,
} from "../parts/person-list-item"
import { SwipeableListItem } from "#app/components/swipeable-list-item"
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
import { Button } from "#shared/ui/button"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale } from "#shared/intl/setup"
import { Trash, ArrowCounterclockwise } from "react-bootstrap-icons"

export { DeletedPerson }

type DeletedPersonProps = {
	person: PersonListItemPerson
	searchQuery?: string
	noLazy?: boolean
}

function DeletedPerson({ person, searchQuery, noLazy }: DeletedPersonProps) {
	let me = useAccount(UserAccount)
	let t = useIntl()
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined
	let [restoreOpen, setRestoreOpen] = useState(false)
	let [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

	let ref = { personId: person.$jazz.id, personName: person.name }

	async function restore() {
		if (!me.$isLoaded) return
		let result = await handleRestorePerson(me, ref, t)
		if (result.ok) setRestoreOpen(false)
	}

	async function permanentlyDelete() {
		if (!me.$isLoaded) return
		let result = await handlePermanentlyDeletePerson(person, me, t)
		if (result.ok) {
			setConfirmDeleteOpen(false)
			setRestoreOpen(false)
		}
	}

	let deletedTimeAgo = formatDistanceToNow(
		person.deletedAt ??
			person.updatedAt ??
			person.createdAt ??
			new Date(person.$jazz.lastUpdatedAt || person.$jazz.createdAt),
		{ addSuffix: true, locale: dfnsLocale },
	)

	return (
		<>
			<SwipeableListItem
				leftAction={{
					variant: "destructive",
					icon: <Trash />,
					label: <T k="person.permanentDelete.button" />,
					onAction: () => setConfirmDeleteOpen(true),
				}}
				rightAction={{
					variant: "success",
					icon: <ArrowCounterclockwise />,
					label: <T k="person.restore.button" />,
					onAction: restore,
				}}
			>
				<Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
					<DialogTrigger>
						<div className="pointer-fine:hover:bg-muted active:bg-accent flex flex-1 cursor-pointer rounded-lg transition-colors duration-150">
							<DeletedPersonListItem
								person={person}
								searchQuery={searchQuery}
								noLazy={noLazy}
							/>
						</div>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								<T k="person.restore.title" params={{ name: person.name }} />
							</DialogTitle>
							<DialogDescription>
								<T
									k="person.restore.deletionInfo"
									params={{ timeAgo: deletedTimeAgo }}
								/>
								<T k="person.restore.question" />
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3">
							<Button className="h-12 w-full" onClick={restore}>
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
			</SwipeableListItem>

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
						<AlertDialogAction onClick={permanentlyDelete}>
							<T k="person.permanentDelete.button" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
