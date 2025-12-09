import { Badge } from "#shared/ui/badge"
import { PersonFill } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { Group, type co } from "jazz-tools"
import { Note, Person, Reminder } from "#shared/schema/user"

export { SharedIndicator, getSharingStatus }

function SharedIndicator({
	item,
}: {
	item:
		| co.loaded<typeof Person>
		| co.loaded<typeof Note>
		| co.loaded<typeof Reminder>
}) {
	let sharedStatus = getSharingStatus(item)
	if (sharedStatus === "none") return null
	return (
		<Badge variant="secondary">
			<PersonFill />
			{sharedStatus === "owner" ? (
				<T k="person.shared.indicator.owner.badge" />
			) : (
				<T k="person.shared.indicator.badge" />
			)}
		</Badge>
	)
}

function getSharingStatus(
	item:
		| co.loaded<typeof Person>
		| co.loaded<typeof Note>
		| co.loaded<typeof Reminder>,
): "none" | "owner" | "collaborator" {
	let owner = item.$jazz.owner
	if (!(owner instanceof Group)) return "none"

	let myRole = owner.myRole()
	if (myRole !== "admin") return "collaborator"

	// Check if there are collaborators via InviteGroups
	for (let inviteGroup of owner.getParentGroups()) {
		let hasMembers = inviteGroup.members.some(
			m => m.role !== "admin" && (m.role === "writer" || m.role === "reader"),
		)
		if (hasMembers) return "owner"
	}

	return "none"
}
