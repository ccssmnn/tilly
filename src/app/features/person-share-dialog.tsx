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
	let [inviteGroups, setInviteGroups] = useState<InviteGroupWithMembers[]>([])
	let [pendingInvites, setPendingInvites] = useState<PendingInviteGroup[]>([])
	let [isLoading, setIsLoading] = useState(true)
	let [refreshKey, setRefreshKey] = useState(0)

	let personGroup = person.$jazz.owner
	let isAdmin = personGroup instanceof Group && personGroup.myRole() === "admin"

	useEffect(() => {
		async function load() {
			let [groupsResult, pendingResult] = await Promise.all([
				tryCatch(getInviteGroupsWithMembers(person)),
				tryCatch(Promise.resolve(getPendingInviteGroups(person))),
			])
			setIsLoading(false)
			if (groupsResult.ok) {
				setInviteGroups(groupsResult.data)
			}
			if (pendingResult.ok) {
				setPendingInvites(pendingResult.data)
			}
		}
		load()
	}, [person, refreshKey])
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
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
					<InviteLinkSection
						person={person}
						hasPlusAccess={hasPlusAccess}
						onLinkGenerated={() => setRefreshKey(k => k + 1)}
					/>
					{isAdmin && (
						<PendingInvitesSection
							person={person}
							pendingInvites={pendingInvites}
							isLoading={isLoading}
							onInviteCancelled={groupId =>
								setPendingInvites(prev =>
									prev.filter(p => p.groupId !== groupId),
								)
							}
						/>
					)}
					<CollaboratorsSection
						person={person}
						inviteGroups={inviteGroups}
						isLoading={isLoading}
						isAdmin={isAdmin}
						onGroupRemoved={groupId =>
							setInviteGroups(prev => prev.filter(g => g.groupId !== groupId))
						}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function InviteLinkSection({
	person,
	hasPlusAccess,
	onLinkGenerated,
}: {
	person: LoadedPerson
	hasPlusAccess: boolean
	onLinkGenerated: () => void
}) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [inviteLink, setInviteLink] = useState("")
	let [isGenerating, setIsGenerating] = useState(false)
	let [isCopied, setIsCopied] = useState(false)

	let hasNativeShare = typeof navigator !== "undefined" && "share" in navigator

	async function handleGenerateLink() {
		if (!me.$isLoaded) return

		setIsGenerating(true)

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
		onLinkGenerated()
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

	return (
		<div className="space-y-3">
			<label className="text-sm font-medium">
				<T k="person.share.inviteLink.label" />
			</label>
			{inviteLink ? (
				<div className="flex gap-2">
					<Input value={inviteLink} readOnly className="font-mono text-xs" />
					<Button
						variant="secondary"
						size="icon"
						onClick={handleCopyLink}
						aria-label={t("person.share.inviteLink.copy")}
					>
						{isCopied ? <Check /> : <Clipboard />}
					</Button>
					{hasNativeShare && (
						<Button
							variant="secondary"
							size="icon"
							onClick={handleNativeShare}
							aria-label={t("person.share.inviteLink.share")}
						>
							<PlatformShareIcon />
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
	)
}

function PendingInvitesSection({
	person,
	pendingInvites,
	isLoading,
	onInviteCancelled,
}: {
	person: LoadedPerson
	pendingInvites: PendingInviteGroup[]
	isLoading: boolean
	onInviteCancelled: (groupId: string) => void
}) {
	let t = useIntl()
	let locale = useLocale()
	let [cancellingInviteId, setCancellingInviteId] = useState<string | null>(
		null,
	)

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
		onInviteCancelled(groupId)
	}

	return (
		<div className="space-y-3">
			<label className="text-sm font-medium">
				<T k="person.share.pending.title" />
			</label>
			{isLoading ? (
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
								<Link45deg className="text-muted-foreground" />
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
								onClick={() => handleCancelPendingInvite(invite.groupId)}
								disabled={cancellingInviteId === invite.groupId}
							>
								<X />
								<T k="person.share.pending.cancel" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

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

function PlatformShareIcon() {
	return isMac() ? <BoxArrowUp /> : <Share />
}
