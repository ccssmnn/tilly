import { Group, type co } from "jazz-tools"
import { Note, Person, Reminder } from "#shared/schema/user"

export { getSharingStatus }

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
