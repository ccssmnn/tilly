export { isPersonAdmin, getPersonOwnerName }

import { Group, co } from "jazz-tools"
import { Person } from "#shared/schema/user"

function isPersonAdmin(person: co.loaded<typeof Person>): boolean {
	let owner = person.$jazz.owner
	if (!(owner instanceof Group)) return true // Account-owned = user is owner
	return owner.myRole() === "admin"
}

async function getPersonOwnerName(
	person: co.loaded<typeof Person>,
): Promise<string | null> {
	let group = person.$jazz.owner
	if (!group || !(group instanceof Group)) return null

	let admin = group.members.find(m => m.role === "admin")
	if (!admin?.account?.$isLoaded) return null

	let profile = await admin.account.$jazz.ensureLoaded({
		resolve: { profile: true },
	})
	return profile.profile?.name ?? null
}
