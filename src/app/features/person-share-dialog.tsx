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
import { Person, UserAccount, Note, Reminder } from "#shared/schema/user"

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

type Collaborator = {
	id: string
	role: "admin" | "writer" | "reader" | "writeOnly" | "manager"
	name: string
	inviteGroupId?: string
}
type InviteGroupWithMembers = {
	groupId: string
	createdAt: Date
	members: Collaborator[]
}
type PendingInviteGroup = {
	groupId: string
	createdAt: Date
}

type FullyLoadedPerson = co.loaded<
	typeof Person,
	{
		notes: { $each: true }
		reminders: { $each: true }
		inactiveNotes: { $each: true }
		inactiveReminders: { $each: true }
	}
>

async function createPersonInviteLink(
	person: FullyLoadedPerson,
	userId: string,
): Promise<string> {
	let personGroup = getPersonGroup(person)

	let baseURL = `${window.location.origin}/app/invite`

	if (personGroup) {
		let myRole = personGroup.myRole()
		if (myRole !== "admin") {
			throw new Error("Only admins can create invite links")
		}

		let needsMigration = !areNestedListsGroupOwned(person, personGroup)
		if (needsMigration) {
			await migrateNestedListsToGroup(person, personGroup)
		}

		let inviteGroup = Group.create()
		personGroup.addMember(inviteGroup, "writer")

		let inviteSecret = inviteGroup.$jazz.createInvite("writer")
		return `${baseURL}#/person/${person.$jazz.id}/invite/${inviteGroup.$jazz.id}/${inviteSecret}`
	} else {
		let { group: newPersonGroup, person: newPerson } =
			await migratePersonToGroup(person, userId)

		let inviteGroup = Group.create()
		newPersonGroup.addMember(inviteGroup, "writer")

		let inviteSecret = inviteGroup.$jazz.createInvite("writer")
		return `${baseURL}#/person/${newPerson.$jazz.id}/invite/${inviteGroup.$jazz.id}/${inviteSecret}`
	}
}

async function getInviteGroupsWithMembers(
	person: co.loaded<typeof Person>,
): Promise<InviteGroupWithMembers[]> {
	let personGroup = getPersonGroup(person)
	if (!personGroup) return []

	let inviteGroups: InviteGroupWithMembers[] = []

	let parentGroups = personGroup.getParentGroups()
	for (let inviteGroup of parentGroups) {
		let members: Collaborator[] = []

		for (let member of inviteGroup.members) {
			if (member.role === "admin") continue

			if (member.account && member.account.$isLoaded) {
				let profile = await member.account.$jazz.ensureLoaded({
					resolve: { profile: true },
				})
				members.push({
					id: member.id,
					role: member.role,
					name: profile.profile?.name ?? "Unknown",
					inviteGroupId: inviteGroup.$jazz.id,
				})
			}
		}

		if (members.length > 0) {
			inviteGroups.push({
				groupId: inviteGroup.$jazz.id,
				createdAt: new Date(inviteGroup.$jazz.createdAt),
				members,
			})
		}
	}

	return inviteGroups
}

function getPendingInviteGroups(
	person: co.loaded<typeof Person>,
): PendingInviteGroup[] {
	let personGroup = getPersonGroup(person)
	if (!personGroup) return []

	let pendingGroups: PendingInviteGroup[] = []
	let parentGroups = personGroup.getParentGroups()

	for (let inviteGroup of parentGroups) {
		let hasMembers = inviteGroup.members.some(
			m =>
				m.account &&
				m.account.$isLoaded &&
				(m.role === "writer" || m.role === "reader"),
		)

		if (!hasMembers) {
			pendingGroups.push({
				groupId: inviteGroup.$jazz.id,
				createdAt: new Date(inviteGroup.$jazz.createdAt),
			})
		}
	}

	return pendingGroups
}

function removeInviteGroup(
	person: co.loaded<typeof Person>,
	inviteGroupId: ID<Group>,
): void {
	let personGroup = getPersonGroup(person)
	if (!personGroup) throw new Error("Person is not group-owned")

	let parentGroups = personGroup.getParentGroups()
	let inviteGroup = parentGroups.find(g => g.$jazz.id === inviteGroupId)
	if (!inviteGroup) throw new Error("Invite group not found")

	personGroup.removeMember(inviteGroup)
}

function getPersonGroup(person: co.loaded<typeof Person>): Group | null {
	let group = person.$jazz.owner
	if (!group || !(group instanceof Group)) return null
	return group
}

function isGroupOwned(person: co.loaded<typeof Person>): boolean {
	return getPersonGroup(person) !== null
}

function areNestedListsGroupOwned(
	person: FullyLoadedPerson,
	group: Group,
): boolean {
	let groupId = group.$jazz.id

	function isOwnedByGroup(
		list: { $jazz: { owner: unknown } } | undefined,
	): boolean {
		if (!list) return true
		let owner = list.$jazz.owner
		return owner instanceof Group && owner.$jazz.id === groupId
	}

	return (
		isOwnedByGroup(person.notes) &&
		isOwnedByGroup(person.reminders) &&
		isOwnedByGroup(person.inactiveNotes) &&
		isOwnedByGroup(person.inactiveReminders)
	)
}

async function migrateNestedListsToGroup(
	person: FullyLoadedPerson,
	group: Group,
): Promise<void> {
	let groupId = group.$jazz.id

	function needsMigration(
		list: { $jazz: { owner: unknown } } | undefined,
	): boolean {
		if (!list) return false
		let owner = list.$jazz.owner
		return !(owner instanceof Group && owner.$jazz.id === groupId)
	}

	if (needsMigration(person.notes)) {
		let newNotes = co.list(Note).create([], group)
		for (let note of person.notes.values()) {
			if (!note) continue
			let newNote = Note.create(
				{
					version: 1,
					title: note.title,
					content: note.content,
					pinned: note.pinned,
					deletedAt: note.deletedAt,
					permanentlyDeletedAt: note.permanentlyDeletedAt,
					createdAt: note.createdAt,
					updatedAt: note.updatedAt,
				},
				group,
			)
			newNotes.$jazz.push(newNote)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("notes", newNotes as any)
	}

	if (needsMigration(person.reminders)) {
		let newReminders = co.list(Reminder).create([], group)
		for (let reminder of person.reminders.values()) {
			if (!reminder) continue
			let newReminder = Reminder.create(
				{
					version: 1,
					text: reminder.text,
					dueAtDate: reminder.dueAtDate,
					repeat: reminder.repeat,
					done: reminder.done,
					deletedAt: reminder.deletedAt,
					permanentlyDeletedAt: reminder.permanentlyDeletedAt,
					createdAt: reminder.createdAt,
					updatedAt: reminder.updatedAt,
				},
				group,
			)
			newReminders.$jazz.push(newReminder)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("reminders", newReminders as any)
	}

	if (person.inactiveNotes && needsMigration(person.inactiveNotes)) {
		let newInactiveNotes = co.list(Note).create([], group)
		for (let note of person.inactiveNotes.values()) {
			if (!note) continue
			let newNote = Note.create(
				{
					version: 1,
					title: note.title,
					content: note.content,
					pinned: note.pinned,
					deletedAt: note.deletedAt,
					permanentlyDeletedAt: note.permanentlyDeletedAt,
					createdAt: note.createdAt,
					updatedAt: note.updatedAt,
				},
				group,
			)
			newInactiveNotes.$jazz.push(newNote)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("inactiveNotes", newInactiveNotes as any)
	}

	if (person.inactiveReminders && needsMigration(person.inactiveReminders)) {
		let newInactiveReminders = co.list(Reminder).create([], group)
		for (let reminder of person.inactiveReminders.values()) {
			if (!reminder) continue
			let newReminder = Reminder.create(
				{
					version: 1,
					text: reminder.text,
					dueAtDate: reminder.dueAtDate,
					repeat: reminder.repeat,
					done: reminder.done,
					deletedAt: reminder.deletedAt,
					permanentlyDeletedAt: reminder.permanentlyDeletedAt,
					createdAt: reminder.createdAt,
					updatedAt: reminder.updatedAt,
				},
				group,
			)
			newInactiveReminders.$jazz.push(newReminder)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		person.$jazz.set("inactiveReminders", newInactiveReminders as any)
	}
}

type MigrationResult = {
	group: Group
	person: co.loaded<typeof Person>
}

async function migratePersonToGroup(
	person: FullyLoadedPerson,
	userId: string,
): Promise<MigrationResult> {
	if (isGroupOwned(person)) {
		return { group: getPersonGroup(person)!, person }
	}

	let group = Group.create()

	let now = new Date()
	let newPerson = Person.create(
		{
			version: 1,
			name: person.name,
			summary: person.summary,
			notes: co.list(Note).create([], group),
			reminders: co.list(Reminder).create([], group),
			createdAt: person.createdAt ?? now,
			updatedAt: now,
		},
		group,
	)

	if (person.avatar) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		newPerson.$jazz.set("avatar", person.avatar as any)
	}

	for (let note of person.notes.values()) {
		if (!note) continue
		let newNote = Note.create(
			{
				version: 1,
				title: note.title,
				content: note.content,
				pinned: note.pinned,
				deletedAt: note.deletedAt,
				permanentlyDeletedAt: note.permanentlyDeletedAt,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			},
			group,
		)
		newPerson.notes.$jazz.push(newNote)
	}

	for (let reminder of person.reminders.values()) {
		if (!reminder) continue
		let newReminder = Reminder.create(
			{
				version: 1,
				text: reminder.text,
				dueAtDate: reminder.dueAtDate,
				repeat: reminder.repeat,
				done: reminder.done,
				deletedAt: reminder.deletedAt,
				permanentlyDeletedAt: reminder.permanentlyDeletedAt,
				createdAt: reminder.createdAt,
				updatedAt: reminder.updatedAt,
			},
			group,
		)
		newPerson.reminders.$jazz.push(newReminder)
	}

	let account = await UserAccount.load(userId, {
		resolve: { root: { people: true } },
	})
	if (!account?.$isLoaded) throw new Error("User account not found")

	let idx = account.root.people.findIndex(p => p?.$jazz.id === person.$jazz.id)
	if (idx !== -1) {
		account.root.people.$jazz.set(idx, newPerson)
	}

	person.$jazz.set("permanentlyDeletedAt", now)

	return { group, person: newPerson }
}
