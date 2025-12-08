import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
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
import { Input } from "#shared/ui/input"
import { Person, UserAccount } from "#shared/schema/user"
import {
	createPersonInviteLink,
	getInviteGroupsWithMembers,
	removeInviteGroup,
} from "#app/features/person-sharing"
import type { InviteGroupWithMembers } from "#app/features/person-sharing"
import { tryCatch } from "#shared/lib/trycatch"
import { isMac } from "#app/hooks/use-pwa"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { co, Group, type ID } from "jazz-tools"
import { useAccount } from "jazz-tools/react"
import {
	Clipboard,
	Check,
	Share,
	BoxArrowUp,
	X,
	PersonFill,
} from "react-bootstrap-icons"

export { PersonShareDialog }

type LoadedPerson = co.loaded<
	typeof Person,
	{ notes: { $each: true }; reminders: { $each: true } }
>

let fullResolve = {
	notes: { $each: true },
	reminders: { $each: true },
	inactiveNotes: { $each: true },
	inactiveReminders: { $each: true },
} as const

function PersonShareDialog({
	open,
	onOpenChange,
	person,
	hasPlusAccess,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	person: LoadedPerson
	hasPlusAccess: boolean
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{open && (
				<PersonShareDialogContent
					person={person}
					onOpenChange={onOpenChange}
					hasPlusAccess={hasPlusAccess}
				/>
			)}
		</Dialog>
	)
}

function PersonShareDialogContent({
	person,
	hasPlusAccess,
}: {
	person: LoadedPerson
	onOpenChange: (open: boolean) => void
	hasPlusAccess: boolean
}) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [inviteLink, setInviteLink] = useState<string | null>(null)
	let [isGenerating, setIsGenerating] = useState(false)
	let [isCopied, setIsCopied] = useState(false)
	let [inviteGroups, setInviteGroups] = useState<InviteGroupWithMembers[]>([])
	let [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true)
	let [removingGroupId, setRemovingGroupId] = useState<string | null>(null)
	let [confirmRemoveGroup, setConfirmRemoveGroup] =
		useState<InviteGroupWithMembers | null>(null)
	let [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		async function load() {
			let result = await tryCatch(getInviteGroupsWithMembers(person))
			setIsLoadingCollaborators(false)
			if (result.ok) {
				setInviteGroups(result.data)
			}
		}
		load()
	}, [person, refreshKey])

	async function handleGenerateLink() {
		if (!me.$isLoaded) return

		setIsGenerating(true)

		// Load full person with inactive lists for migration check
		let fullPerson = await Person.load(person.$jazz.id, {
			resolve: fullResolve,
		})
		if (!fullPerson.$isLoaded) {
			setIsGenerating(false)
			toast.error(t("invite.error.failed"))
			return
		}

		let result = await tryCatch(createPersonInviteLink(fullPerson, me.$jazz.id))
		setIsGenerating(false)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setInviteLink(result.data)
		setRefreshKey(k => k + 1)
	}

	async function handleCopyLink() {
		if (!inviteLink) return

		await navigator.clipboard.writeText(inviteLink)
		setIsCopied(true)
		toast.success(t("person.share.inviteLink.copied"))
		setTimeout(() => setIsCopied(false), 2000)
	}

	async function handleNativeShare() {
		if (!inviteLink) return

		if (typeof navigator.share === "function") {
			await navigator.share({
				title: t("person.share.dialog.title", { name: person.name }),
				url: inviteLink,
			})
		}
	}

	function handleRemoveClick(group: InviteGroupWithMembers) {
		// If only one member, show confirmation with that member
		// If multiple members, show confirmation listing all
		setConfirmRemoveGroup(group)
	}

	function handleConfirmRemove() {
		if (!confirmRemoveGroup) return

		setRemovingGroupId(confirmRemoveGroup.groupId)
		let result = tryCatch(() =>
			removeInviteGroup(person, confirmRemoveGroup.groupId as ID<Group>),
		)
		setRemovingGroupId(null)
		setConfirmRemoveGroup(null)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.share.remove.success"))
		setInviteGroups(prev =>
			prev.filter(g => g.groupId !== confirmRemoveGroup?.groupId),
		)
	}

	let personGroup = person.$jazz.owner
	let isAdmin = personGroup instanceof Group && personGroup.myRole() === "admin"
	let allCollaborators = inviteGroups.flatMap(g => g.members)
	let hasNativeShare = typeof navigator !== "undefined" && "share" in navigator

	return (
		<>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="person.share.dialog.title" params={{ name: person.name }} />
						</DialogTitle>
						<DialogDescription>
							<T k="person.share.dialog.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-6">
					{/* Invite link section */}
					<div className="space-y-3">
						<label className="text-sm font-medium">
							<T k="person.share.inviteLink.label" />
						</label>
						{inviteLink ? (
							<div className="flex gap-2">
								<Input
									value={inviteLink}
									readOnly
									className="font-mono text-xs"
								/>
								<Button
									variant="secondary"
									size="icon"
									onClick={handleCopyLink}
								>
									{isCopied ? (
										<Check className="h-4 w-4" />
									) : (
										<Clipboard className="h-4 w-4" />
									)}
								</Button>
								{hasNativeShare && (
									<Button
										variant="secondary"
										size="icon"
										onClick={handleNativeShare}
									>
										<PlatformShareIcon className="h-4 w-4" />
									</Button>
								)}
							</div>
						) : (
							<Button
								onClick={handleGenerateLink}
								disabled={isGenerating || !hasPlusAccess}
								className="w-full"
							>
								{isGenerating ? (
									<T k="common.loading" />
								) : !hasPlusAccess ? (
									<T k="person.share.requiresPlus" />
								) : (
									<T k="person.share.inviteLink.generate" />
								)}
							</Button>
						)}
					</div>

					{/* Collaborators section */}
					<div className="space-y-3">
						<label className="text-sm font-medium">
							<T k="person.share.collaborators.title" />
						</label>
						{isLoadingCollaborators ? (
							<p className="text-muted-foreground text-sm">
								<T k="common.loading" />
							</p>
						) : allCollaborators.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								<T k="person.share.collaborators.empty" />
							</p>
						) : (
							<ul className="space-y-2">
								{inviteGroups.map(group =>
									group.members.map((collaborator, idx) => (
										<li
											key={collaborator.id}
											className="flex items-center justify-between gap-2"
										>
											<div className="flex items-center gap-2">
												<PersonFill className="text-muted-foreground h-4 w-4" />
												<span className="text-sm">{collaborator.name}</span>
											</div>
											{isAdmin && idx === 0 && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRemoveClick(group)}
													disabled={removingGroupId === group.groupId}
												>
													<X className="h-4 w-4" />
													<T k="person.share.collaborators.remove" />
												</Button>
											)}
										</li>
									)),
								)}
							</ul>
						)}
					</div>
				</div>
			</DialogContent>

			<AlertDialog
				open={!!confirmRemoveGroup}
				onOpenChange={open => !open && setConfirmRemoveGroup(null)}
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
									<PersonFill className="text-muted-foreground h-4 w-4" />
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

function PlatformShareIcon({ className }: { className?: string }) {
	return isMac() ? (
		<BoxArrowUp className={className} />
	) : (
		<Share className={className} />
	)
}
