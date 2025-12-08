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
	getPendingInviteGroups,
	removeInviteGroup,
} from "#app/features/person-sharing"
import type {
	InviteGroupWithMembers,
	PendingInviteGroup,
} from "#app/features/person-sharing"
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
	Link45deg,
} from "react-bootstrap-icons"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale } from "#shared/intl/setup"

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
	hasPlusAccess: boolean
}) {
	let t = useIntl()
	let locale = useLocale()
	let me = useAccount(UserAccount)
	let [inviteLink, setInviteLink] = useState<string | null>(null)
	let [isGenerating, setIsGenerating] = useState(false)
	let [isCopied, setIsCopied] = useState(false)
	let [inviteGroups, setInviteGroups] = useState<InviteGroupWithMembers[]>([])
	let [pendingInvites, setPendingInvites] = useState<PendingInviteGroup[]>([])
	let [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true)
	let [removingCollaboratorId, setRemovingCollaboratorId] = useState<
		string | null
	>(null)
	let [confirmRemoveGroup, setConfirmRemoveGroup] =
		useState<InviteGroupWithMembers | null>(null)
	let [cancellingInviteId, setCancellingInviteId] = useState<string | null>(
		null,
	)
	let [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		async function load() {
			let [groupsResult, pendingResult] = await Promise.all([
				tryCatch(getInviteGroupsWithMembers(person)),
				tryCatch(Promise.resolve(getPendingInviteGroups(person))),
			])
			setIsLoadingCollaborators(false)
			if (groupsResult.ok) {
				setInviteGroups(groupsResult.data)
			}
			if (pendingResult.ok) {
				setPendingInvites(pendingResult.data)
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
		setInviteGroups(prev =>
			prev.filter(g => g.groupId !== confirmRemoveGroup?.groupId),
		)
	}

	function handleCancelPendingInvite(groupId: string) {
		setCancellingInviteId(groupId)

		let result = tryCatch(() => removeInviteGroup(person, groupId as ID<Group>))
		setCancellingInviteId(null)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.share.pending.cancelSuccess"))
		setPendingInvites(prev => prev.filter(p => p.groupId !== groupId))
		// Clear invite link if it was for this group
		if (inviteLink?.includes(groupId)) {
			setInviteLink(null)
		}
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

					{/* Pending invites section */}
					{isAdmin && (
						<div className="space-y-3">
							<label className="text-sm font-medium">
								<T k="person.share.pending.title" />
							</label>
							{isLoadingCollaborators ? (
								<p className="text-muted-foreground text-sm">
									<T k="common.loading" />
								</p>
							) : pendingInvites.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									<T k="person.share.pending.empty" />
								</p>
							) : (
								<ul className="space-y-2">
									{pendingInvites.map(invite => (
										<li
											key={invite.groupId}
											className="flex items-center justify-between gap-2"
										>
											<div className="flex items-center gap-2">
												<Link45deg className="text-muted-foreground h-4 w-4" />
												<span className="text-muted-foreground text-sm">
													{t("person.share.pending.createdAt", {
														ago: formatDistanceToNow(invite.createdAt, {
															addSuffix: true,
															locale: locale === "de" ? dfnsDe : undefined,
														}),
													})}
												</span>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleCancelPendingInvite(invite.groupId)
												}
												disabled={cancellingInviteId === invite.groupId}
											>
												<X className="h-4 w-4" />
												<T k="person.share.pending.cancel" />
											</Button>
										</li>
									))}
								</ul>
							)}
						</div>
					)}

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
								{inviteGroups.flatMap(group =>
									group.members.map(collaborator => (
										<li
											key={collaborator.id}
											className="flex items-center justify-between gap-2"
										>
											<div className="flex items-center gap-2">
												<PersonFill className="text-muted-foreground h-4 w-4" />
												<span className="text-sm">{collaborator.name}</span>
											</div>
											{isAdmin && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleRemoveClick(collaborator.id, group)
													}
													disabled={removingCollaboratorId === collaborator.id}
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
