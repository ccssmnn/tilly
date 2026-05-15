import { useState } from "react"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
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
import { Person, UserAccount, isDeleted } from "#shared/schema/user"
import {
	Collection,
	PencilSquare,
	Trash,
	Share,
	BoxArrowRight,
} from "react-bootstrap-icons"
import { PersonForm } from "./person-form"
import { PersonShareDialog } from "./person-share-dialog"
import { ManageListsDialog } from "./manage-lists-dialog"
import { useHasPlusAccess } from "#app/hooks/use-plus-access"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { updatePerson } from "#shared/tools/person-update"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useIntl } from "#shared/intl/setup"
import { useAccount } from "jazz-tools/react"
import { Group, co } from "jazz-tools"
import { isPersonAdmin } from "../lib/person-utils"
import type { ReactNode } from "react"
import { testIds } from "#shared/lib/test-ids"

export { ActionsDropdown }

type Query = {
	avatar: true
	notes: { $each: { $onError: "catch" } }
	reminders: { $each: { $onError: "catch" } }
}

function ActionsDropdown({
	children,
	person,
	me,
}: {
	children: ReactNode
	person: co.loaded<typeof Person, Query>
	me: co.loaded<typeof UserAccount>
}) {
	let navigate = useNavigate()
	let t = useIntl()
	let [actionsOpen, setActionsOpen] = useState(false)
	let [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
	let [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	let [isStopSharingDialogOpen, setIsStopSharingDialogOpen] = useState(false)
	let [isManageListsDialogOpen, setIsManageListsDialogOpen] = useState(false)
	let [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

	let { hasPlusAccess, isLoading: isPlusLoading } = useHasPlusAccess()
	let isAdmin = isPersonAdmin(person)
	let isShared = !isAdmin
	let showShare = isAdmin && !isPlusLoading

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
			updatePerson(me, {
				personId: person.$jazz.id,
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

		setIsEditDrawerOpen(false)
		setActionsOpen(false)
		toast.success(t("toast.personUpdated"), {
			action: {
				label: t("common.undo"),
				onClick: async () => {
					let undoResult = await tryCatch(
						updatePerson(me, {
							personId: person.$jazz.id,
							name: result.data.previous.name,
							summary: result.data.previous.summary,
						}),
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
			updatePerson(me, { personId: person.$jazz.id, deletedAt: new Date() }),
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
						updatePerson(me, {
							personId: person.$jazz.id,
							deletedAt: undefined,
						}),
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
		let personGroup = person.$jazz.owner
		if (!(personGroup instanceof Group)) return

		let result = tryCatch(() => {
			if (!me.$isLoaded) throw new Error("User not loaded")

			for (let inviteGroup of personGroup.getParentGroups()) {
				let member = inviteGroup.members.find(m => m.id === me.$jazz.id)
				if (!member) continue
				inviteGroup.removeMember(me)
				return
			}
			throw new Error("Could not find membership")
		})
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
			<Dialog
				open={actionsOpen}
				onOpenChange={open => {
					setActionsOpen(open)
					if (!open) {
						setIsEditDrawerOpen(false)
					}
				}}
			>
				<DialogTrigger
					render={<span className="contents" />}
					nativeButton={false}
				>
					{children}
				</DialogTrigger>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							<T k="person.actions.title" />
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2">
						{showShare && (
							<Button
								variant="outline"
								className="w-full justify-between"
								onClick={() => {
									setActionsOpen(false)
									setIsShareDialogOpen(true)
								}}
							>
								<T k="person.share.button" />
								<Share />
							</Button>
						)}
						<Button
							variant="outline"
							className="w-full justify-between"
							onClick={() => {
								setActionsOpen(false)
								setIsManageListsDialogOpen(true)
							}}
						>
							<T k="person.manageLists.title" />
							<Collection />
						</Button>
						<Dialog open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
							<DialogTrigger
								render={
									<Button
										variant="outline"
										className="w-full justify-between"
										data-testid={testIds.person.editButton}
									/>
								}
							>
								<T k="person.edit.title" />
								<PencilSquare />
							</DialogTrigger>
							<DialogContent className="max-w-xl">
								<DialogHeader>
									<DialogTitle>
										<T k="person.edit.title" />
									</DialogTitle>
									<p className="text-muted-foreground text-sm">
										<T k="person.edit.description" />
									</p>
								</DialogHeader>
								<PersonForm person={person} onSave={handleFormSave} />
							</DialogContent>
						</Dialog>
						{isShared ? (
							<Button
								variant="destructive"
								className="w-full justify-between"
								onClick={() => {
									setActionsOpen(false)
									setIsStopSharingDialogOpen(true)
								}}
							>
								<T k="person.leave.button" />
								<BoxArrowRight />
							</Button>
						) : (
							<Button
								variant="destructive"
								className="w-full justify-between"
								onClick={() => {
									setActionsOpen(false)
									setIsDeleteDialogOpen(true)
								}}
								data-testid={testIds.person.deleteButton}
							>
								<T k="person.delete.title" />
								<Trash />
							</Button>
						)}
					</div>
					<DialogFooter>
						<DialogClose
							render={<Button variant="outline" className="w-full" />}
						>
							<T k="common.cancel" />
						</DialogClose>
					</DialogFooter>
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
						<AlertDialogAction
							onClick={handleDeletePerson}
							data-testid={testIds.person.deleteConfirmButton}
						>
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
				hasPlusAccess={hasPlusAccess}
			/>
		</>
	)
}
