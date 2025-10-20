import { Image as JazzImage } from "jazz-tools/react"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
import { Person, UserAccount } from "#shared/schema/user"
import { co } from "jazz-tools"
import { PencilSquare, Trash } from "react-bootstrap-icons"
import { PersonForm } from "./person-form"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { updatePerson } from "#shared/tools/person-update"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useLocale, useIntl } from "#shared/intl/setup"

type Query = {
	avatar: true
	notes: { $each: true }
	reminders: { $each: true }
}

export function PersonDetails({
	person,
}: {
	person: co.loaded<typeof Person, Query>
	me: co.loaded<typeof UserAccount>
}) {
	let navigate = useNavigate()
	let locale = useLocale()
	let t = useIntl()
	let [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	let [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	let [actionsDialogOpen, setActionsDialogOpen] = useState(false)

	async function handleFormSave(values: {
		name: string
		summary?: string
		avatar?: File | null
	}) {
		let result = await tryCatch(
			updatePerson(person.$jazz.id, {
				name: values.name,
				summary: values.summary,
				avatarFile: values.avatar,
			}),
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
						updatePerson(person.$jazz.id, result.data.previous),
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
			updatePerson(person.$jazz.id, { deletedAt: new Date() }),
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
						updatePerson(person.$jazz.id, { deletedAt: undefined }),
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
				<Avatar
					className="size-48 cursor-pointer"
					onClick={() => setActionsDialogOpen(true)}
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
				<div className="w-full flex-1 md:w-auto">
					<div className="flex items-center justify-between gap-3">
						<h1 className="text-3xl font-bold select-text">{person.name}</h1>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setActionsDialogOpen(true)}
						>
							<T k="person.actions.title" />
						</Button>
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
			<Dialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="person.actions.title" />
							</DialogTitle>
						</DialogHeader>
					}
				>
					<div className="flex flex-col items-center gap-3">
						<Button
							variant="secondary"
							className="h-12 w-full"
							onClick={() => {
								setActionsDialogOpen(false)
								setIsEditDialogOpen(true)
							}}
						>
							<PencilSquare />
							<T k="person.edit.title" />
						</Button>
						<Button
							variant="destructive"
							className="h-12 w-full"
							onClick={() => {
								setActionsDialogOpen(false)
								setIsDeleteDialogOpen(true)
							}}
						>
							<Trash />
							<T k="person.delete.title" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="person.edit.title" />
							</DialogTitle>
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
		</>
	)
}
