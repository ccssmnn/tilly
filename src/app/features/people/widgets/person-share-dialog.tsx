import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "#shared/ui/dialog"
import { Person } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import { T } from "#shared/intl/setup"
import { co, Group } from "jazz-tools"
import { InviteLinkSection } from "./invite-link-section"
import { PendingInvitesSection } from "../parts/pending-invites-section"
import { CollaboratorsSection } from "../parts/collaborators-section"
import {
	getInviteGroupsWithMembers,
	getPendingInviteGroups,
	type InviteGroupWithMembers,
	type PendingInviteGroup,
} from "../lib/person-sharing"

export { PersonShareDrawer as PersonShareDialog }

type LoadedPerson = co.loaded<
	typeof Person,
	{
		notes: { $each: { $onError: "catch" } }
		reminders: { $each: { $onError: "catch" } }
	}
>

function PersonShareDrawer({
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<T k="person.share.dialog.title" params={{ name: person.name }} />
					</DialogTitle>
					<DialogDescription>
						<T k="person.share.dialog.description" />
					</DialogDescription>
				</DialogHeader>
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
