import { Image as JazzImage, useAccount } from "jazz-tools/react"
import { Group, co } from "jazz-tools"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogDescription,
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
import { Badge } from "#shared/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "#shared/ui/tooltip"
import { Person, UserAccount, isDeleted } from "#shared/schema/user"
import { extractHashtags } from "#app/features/list-utilities"
import {
	Collection,
	PencilSquare,
	Trash,
	Plus,
	X,
	Share,
	BoxArrowRight,
} from "react-bootstrap-icons"
import { PersonForm } from "./person-form"
import { NewListDialog } from "./new-list-dialog"
import { PersonShareDialog } from "./person-share-dialog"
import { useHasPlusAccess } from "./plus"
import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { isTextSelectionOngoing } from "#app/lib/utils"
import { updatePerson } from "#shared/tools/person-update"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useLocale, useIntl } from "#shared/intl/setup"
import { getPersonOwnerName } from "#app/features/person-sharing"
import {
	useCollaborators,
	type Collaborator,
} from "#app/hooks/use-collaborators"
import type { ReactNode } from "react"

export { PersonDetails }

function PersonDetails({
	person,
	me,
}: {
	person: co.loaded<typeof Person, Query>
	me: co.loaded<typeof UserAccount>
}) {
	let navigate = useNavigate()
	let locale = useLocale()
	let t = useIntl()
	let [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	let [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	let [isStopSharingDialogOpen, setIsStopSharingDialogOpen] = useState(false)
	let [isManageListsDialogOpen, setIsManageListsDialogOpen] = useState(false)
	let [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

	let { hasPlusAccess } = useHasPlusAccess()
	let isAdmin = isPersonAdmin(person)
	let isShared = !isAdmin
	let [ownerName, setOwnerName] = useState<string | null>(null)
	let { collaborators: allCollaborators } = useCollaborators(person)
	let collaborators = allCollaborators.filter(c => c.role !== "admin")

	useEffect(() => {
		if (isShared) {
			getPersonOwnerName(person).then(setOwnerName)
		}
	}, [person, isShared])

	let allPeople = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(p => p && !isDeleted(p))
		},
	})

	async function handleFormSave(values: {
		name: string
		summary?: string
		avatar?: File | null
	}) {
		let result = await tryCatch(
			updatePerson(
				person.$jazz.id,
				{
					name: values.name,
					summary: values.summary,
					avatarFile: values.avatar,
				},
				me,
			),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setIsEditDialogOpen(false)
		toast.success(t("toast.personUpdated"), {
			action: {
				label: t("common.undo"),
				onClick: async () => {
					let undoResult = await tryCatch(
						updatePerson(person.$jazz.id, result.data.previous, me),
					)
					if (undoResult.ok) {
						toast.success(t("toast.personUpdateUndone"))
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
	}

	async function handleDeletePerson() {
		let result = await tryCatch(
			updatePerson(person.$jazz.id, { deletedAt: new Date() }, me),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setIsDeleteDialogOpen(false)
		navigate({ to: "/people" })
		toast.success(t("toast.personDeletedScheduled"), {
			action: {
				label: t("common.undo"),
				onClick: async () => {
					let undoResult = await tryCatch(
						updatePerson(person.$jazz.id, { deletedAt: undefined }, me),
					)
					if (undoResult.ok) {
						toast.success(t("toast.personRestored"))
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
	}

	async function handleStopSharing() {
		let owner = person.$jazz.owner
		if (!(owner instanceof Group)) return

		let result = await tryCatch(
			Promise.resolve().then(() => {
				if (!me.$isLoaded) throw new Error("User not loaded")
				owner.removeMember(me)
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setIsStopSharingDialogOpen(false)
		navigate({ to: "/people" })
		toast.success(t("person.leave.success", { name: person.name }))
	}

	return (
		<>
			<div className="flex flex-col items-center gap-6 md:flex-row">
				<ActionsDropdown
					onEdit={() => setIsEditDialogOpen(true)}
					onDelete={() => setIsDeleteDialogOpen(true)}
					onStopSharing={() => setIsStopSharingDialogOpen(true)}
					onManageLists={() => setIsManageListsDialogOpen(true)}
					onShare={() => setIsShareDialogOpen(true)}
					showShare={hasPlusAccess && isAdmin}
					isShared={isShared}
				>
					<Avatar
						className="size-48 cursor-pointer"
						onClick={e => {
							if (isTextSelectionOngoing()) {
								e.preventDefault()
								return
							}
						}}
					>
						{person.avatar ? (
							<JazzImage
								imageId={person.avatar.$jazz.id}
								alt={person.name}
								width={192}
								data-slot="avatar-image"
								className="aspect-square size-full object-cover shadow-inner"
							/>
						) : (
							<AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
						)}
					</Avatar>
				</ActionsDropdown>
				<div className="w-full flex-1 md:w-auto">
					<div className="flex items-center justify-between gap-3">
						<h1 className="text-3xl font-bold select-text">{person.name}</h1>
						<ActionsDropdown
							onEdit={() => setIsEditDialogOpen(true)}
							onDelete={() => setIsDeleteDialogOpen(true)}
							onStopSharing={() => setIsStopSharingDialogOpen(true)}
							onManageLists={() => setIsManageListsDialogOpen(true)}
							onShare={() => setIsShareDialogOpen(true)}
							showShare={hasPlusAccess && isAdmin}
							isShared={isShared}
						>
							<Button variant="secondary" size="sm">
								<T k="person.actions.title" />
							</Button>
						</ActionsDropdown>
					</div>

					{person.summary && (
						<p className="text-muted-foreground my-3 select-text">
							{person.summary.split(/(#[a-zA-Z0-9_]+)/).map((part, i) =>
								part.startsWith("#") ? (
									<span key={i} className="text-primary font-bold">
										{part}
									</span>
								) : (
									part
								),
							)}
						</p>
					)}

					{isShared && ownerName && (
						<Badge variant="secondary" className="mb-2">
							{t("person.shared.sharedBy", { name: ownerName })}
						</Badge>
					)}
					{isAdmin && collaborators.length > 0 && (
						<SharedWithBadge collaborators={collaborators} />
					)}
					<p className="text-muted-foreground space-y-1 text-sm select-text">
						{t("person.added.suffix", {
							ago: formatDistanceToNow(
								person.createdAt || new Date(person.$jazz.createdAt),
								{
									addSuffix: true,
									locale: locale === "de" ? dfnsDe : undefined,
								},
							),
						})}
						{(person.updatedAt ||
							(person.$jazz.lastUpdatedAt &&
								new Date(person.$jazz.lastUpdatedAt))) &&
							(
								person.updatedAt || new Date(person.$jazz.lastUpdatedAt)
							).getTime() !==
								(
									person.createdAt || new Date(person.$jazz.createdAt)
								).getTime() &&
							t("person.updated.suffix", {
								ago: formatDistanceToNow(
									person.updatedAt || new Date(person.$jazz.lastUpdatedAt),
									{
										addSuffix: true,
										locale: locale === "de" ? dfnsDe : undefined,
									},
								),
							})}
					</p>
				</div>
			</div>
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="person.edit.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="person.edit.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<PersonForm person={person} onSave={handleFormSave} />
				</DialogContent>
			</Dialog>
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<T k="person.delete.title" />
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete {person.name}? This will
							permanently remove all their notes and reminders.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<T k="common.cancel" />
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeletePerson}>
							<T k="person.delete.title" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog
				open={isStopSharingDialogOpen}
				onOpenChange={setIsStopSharingDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("person.leave.title", { name: person.name })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("person.leave.description", { name: person.name })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<T k="common.cancel" />
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleStopSharing}>
							<T k="person.leave.confirm" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<ManageListsDialog
				open={isManageListsDialogOpen}
				onOpenChange={setIsManageListsDialogOpen}
				personId={person.$jazz.id}
				personName={person.name}
				personSummary={person.summary}
				allPeople={allPeople}
			/>
			<PersonShareDialog
				open={isShareDialogOpen}
				onOpenChange={setIsShareDialogOpen}
				person={person}
			/>
		</>
	)
}

type Query = {
	avatar: true
	notes: { $each: true }
	reminders: { $each: true }
}

function ManageListsDialog({
	open,
	onOpenChange,
	personId,
	personName,
	personSummary,
	allPeople,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	personId: string
	personName: string
	personSummary?: string
	allPeople: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
}) {
	let [isLoading, setIsLoading] = useState(false)
	let [isNewListDialogOpen, setIsNewListDialogOpen] = useState(false)
	let me = useAccount(UserAccount)
	let t = useIntl()

	let existingLists = Array.from(
		new Set(
			allPeople
				.flatMap(p => extractHashtags(p.summary))
				.map(tag => tag.substring(1)),
		),
	).sort()

	let personLists = extractHashtags(personSummary).map(tag => tag.substring(1))

	async function handleAddToList(listName: string) {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${listName.toLowerCase()}`
			let currentSummary = personSummary || ""
			let newSummary = `${currentSummary} ${hashtag}`.trim()

			await updatePerson(personId, { summary: newSummary }, me)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleRemoveFromList(listName: string) {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${listName.toLowerCase()}`
			let currentSummary = personSummary || ""
			let newSummary = currentSummary
				.split(/\s+/)
				.filter((word: string) => word !== hashtag)
				.join(" ")
				.trim()

			await updatePerson(personId, { summary: newSummary }, me)
		} finally {
			setIsLoading(false)
		}
	}

	function handleListCreated(hashtag: string) {
		setIsNewListDialogOpen(false)
		toast.success(t("person.manageLists.toast.created", { listName: hashtag }))
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className="sm:max-w-md"
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="person.manageLists.title" />
							</DialogTitle>
							<DialogDescription>
								{t("person.manageLists.description", { name: personName })}
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						{existingLists.length > 0 && (
							<ul className="space-y-2">
								{existingLists.map(listName => {
									let isInList = personLists.includes(listName)
									return (
										<li
											key={listName}
											className="flex items-center justify-between gap-2"
										>
											<span className="text-sm">#{listName}</span>
											<Button
												size="sm"
												variant={isInList ? "destructive" : "default"}
												onClick={() => {
													if (isInList) {
														handleRemoveFromList(listName)
													} else {
														handleAddToList(listName)
													}
												}}
												disabled={isLoading}
											>
												{isInList ? (
													<>
														<X className="mr-1 h-3 w-3" />
														Remove
													</>
												) : (
													<>
														<Plus className="mr-1 h-3 w-3" />
														<T k="common.add" />
													</>
												)}
											</Button>
										</li>
									)
								})}
							</ul>
						)}
						<Button
							onClick={() => setIsNewListDialogOpen(true)}
							disabled={isLoading}
							className="w-full"
						>
							<T k="person.manageLists.createList" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
			<NewListDialog
				open={isNewListDialogOpen}
				onOpenChange={setIsNewListDialogOpen}
				people={allPeople}
				onListCreated={handleListCreated}
				defaultSelectedPeople={new Set([personId])}
			/>
		</>
	)
}

function ActionsDropdown({
	children,
	onEdit,
	onDelete,
	onStopSharing,
	onManageLists,
	onShare,
	showShare = false,
	isShared = false,
}: {
	children: ReactNode
	onEdit: () => void
	onDelete: () => void
	onStopSharing: () => void
	onManageLists: () => void
	onShare?: () => void
	showShare?: boolean
	isShared?: boolean
}) {
	let [open, setOpen] = useState(false)

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent>
				{showShare && onShare && (
					<DropdownMenuItem
						onClick={() => {
							setOpen(false)
							onShare()
						}}
					>
						<T k="person.share.button" />
						<Share />
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onClick={() => {
						setOpen(false)
						onManageLists()
					}}
				>
					<T k="person.manageLists.title" />
					<Collection />
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => {
						setOpen(false)
						onEdit()
					}}
				>
					<T k="person.edit.title" />
					<PencilSquare />
				</DropdownMenuItem>
				{isShared ? (
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							setOpen(false)
							onStopSharing()
						}}
					>
						<T k="person.leave.button" />
						<BoxArrowRight />
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							setOpen(false)
							onDelete()
						}}
					>
						<T k="person.delete.title" />
						<Trash />
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function isPersonAdmin(person: co.loaded<typeof Person>): boolean {
	let owner = person.$jazz.owner
	if (!(owner instanceof Group)) return true // Account-owned = user is owner
	return owner.myRole() === "admin"
}

function SharedWithBadge({ collaborators }: { collaborators: Collaborator[] }) {
	let t = useIntl()
	let names = collaborators.map(c => c.name)

	if (collaborators.length === 1) {
		return (
			<Badge variant="secondary" className="mb-2">
				{t("person.shared.sharedWith", { name: names[0] })}
			</Badge>
		)
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge variant="secondary" className="mb-2 cursor-default">
					{t("person.shared.sharedWithCount", { count: collaborators.length })}
				</Badge>
			</TooltipTrigger>
			<TooltipContent>
				<p>{names.join(", ")}</p>
			</TooltipContent>
		</Tooltip>
	)
}
