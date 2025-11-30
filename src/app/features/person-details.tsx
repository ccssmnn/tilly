import { Image as JazzImage, useAccount } from "jazz-tools/react"
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
import { Person, UserAccount, isDeleted } from "#shared/schema/user"
import { co } from "jazz-tools"
import { Collection, PencilSquare, Trash } from "react-bootstrap-icons"
import { PersonForm } from "./person-form"
import { AddToListDialog } from "./add-to-list-dialog"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { isTextSelectionOngoing } from "#app/lib/utils"
import { updatePerson } from "#shared/tools/person-update"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useLocale, useIntl } from "#shared/intl/setup"
import type { ReactNode } from "react"

type Query = {
	avatar: true
	notes: { $each: true }
	reminders: { $each: true }
}

export { PersonDetails }

function ActionsDropdown({
	children,
	onEdit,
	onDelete,
	onAddToList,
}: {
	children: ReactNode
	onEdit: () => void
	onDelete: () => void
	onAddToList: () => void
}) {
	let [open, setOpen] = useState(false)

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					onClick={() => {
						setOpen(false)
						onAddToList()
					}}
				>
					Add to list
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
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

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
	let [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false)

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
			duration: 10000,
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

	return (
		<>
			<div className="flex flex-col items-center gap-6 md:flex-row">
				<ActionsDropdown
					onEdit={() => setIsEditDialogOpen(true)}
					onDelete={() => setIsDeleteDialogOpen(true)}
					onAddToList={() => setIsAddToListDialogOpen(true)}
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
							onAddToList={() => setIsAddToListDialogOpen(true)}
						>
							<Button variant="secondary" size="sm">
								<T k="person.actions.title" />
							</Button>
						</ActionsDropdown>
					</div>

					{person.summary && (
						<p className="text-muted-foreground my-3 select-text">
							{person.summary}
						</p>
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
			<AddToListDialog
				open={isAddToListDialogOpen}
				onOpenChange={setIsAddToListDialogOpen}
				personId={person.$jazz.id}
				personName={person.name}
				personSummary={person.summary}
				allPeople={allPeople}
			/>
		</>
	)
}
