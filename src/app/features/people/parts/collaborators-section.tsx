import { useState } from "react"
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
import { Person } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { co, Group, type ID } from "jazz-tools"
import { X, PersonFill } from "react-bootstrap-icons"
import {
	removeInviteGroup,
	type InviteGroupWithMembers,
} from "../lib/person-sharing"

export { CollaboratorsSection }

type LoadedPerson = co.loaded<
	typeof Person,
	{
		notes: { $each: { $onError: "catch" } }
		reminders: { $each: { $onError: "catch" } }
	}
>

function CollaboratorsSection({
	person,
	inviteGroups,
	isLoading,
	isAdmin,
	onGroupRemoved,
}: {
	person: LoadedPerson
	inviteGroups: InviteGroupWithMembers[]
	isLoading: boolean
	isAdmin: boolean
	onGroupRemoved: (groupId: string) => void
}) {
	let t = useIntl()
	let [removingCollaboratorId, setRemovingCollaboratorId] = useState<
		string | null
	>(null)
	let [confirmRemoveGroup, setConfirmRemoveGroup] =
		useState<InviteGroupWithMembers | null>(null)

	let allCollaborators = inviteGroups.flatMap(g => g.members)

	function handleRemoveClick(
		collaboratorId: string,
		group: InviteGroupWithMembers,
	) {
		setRemovingCollaboratorId(collaboratorId)
		setConfirmRemoveGroup(group)
	}

	function handleConfirmRemove() {
		if (!confirmRemoveGroup) return

		let result = tryCatch(() =>
			removeInviteGroup(person, confirmRemoveGroup.groupId as ID<Group>),
		)
		setRemovingCollaboratorId(null)
		setConfirmRemoveGroup(null)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.share.remove.success"))
		onGroupRemoved(confirmRemoveGroup.groupId)
	}

	return (
		<>
			<div className="space-y-3">
				<label className="text-sm font-medium">
					<T k="person.share.collaborators.title" />
				</label>
				{isLoading ? (
					<p className="text-muted-foreground text-sm">
						<T k="common.loading" />
					</p>
				) : allCollaborators.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						<T k="person.share.collaborators.empty" />
					</p>
				) : (
					<ul className="space-y-2">
						{inviteGroups.flatMap(group =>
							group.members.map(collaborator => (
								<li
									key={collaborator.id}
									className="flex items-center justify-between gap-2"
								>
									<div className="flex items-center gap-2">
										<PersonFill className="text-muted-foreground" />
										<span className="text-sm">{collaborator.name}</span>
									</div>
									{isAdmin && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveClick(collaborator.id, group)}
											disabled={removingCollaboratorId === collaborator.id}
										>
											<X />
											<T k="person.share.collaborators.remove" />
										</Button>
									)}
								</li>
							)),
						)}
					</ul>
				)}
			</div>

			<AlertDialog
				open={!!confirmRemoveGroup}
				onOpenChange={open => {
					if (!open) {
						setConfirmRemoveGroup(null)
						setRemovingCollaboratorId(null)
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<T k="person.share.remove.title" />
						</AlertDialogTitle>
						<AlertDialogDescription>
							<T k="person.share.remove.description" />
						</AlertDialogDescription>
					</AlertDialogHeader>
					{confirmRemoveGroup && (
						<ul className="my-2 space-y-1">
							{confirmRemoveGroup.members.map(m => (
								<li key={m.id} className="flex items-center gap-2 text-sm">
									<PersonFill className="text-muted-foreground" />
									{m.name}
								</li>
							))}
						</ul>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel>
							<T k="common.cancel" />
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmRemove}>
							<T k="person.share.remove.confirm" />
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
