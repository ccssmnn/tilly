import { useState, useEffect } from "react"
import { Group, type CoValue } from "jazz-tools"
import { useIntl } from "#shared/intl/setup"

export { useCollaborators }
export type { Collaborator }

type CollaboratorRole = "admin" | "manager" | "writer" | "writeOnly" | "reader"

type Collaborator = {
	id: string
	role: CollaboratorRole
	name: string
}

let roleRank: Record<CollaboratorRole, number> = {
	admin: 5,
	manager: 4,
	writer: 3,
	writeOnly: 2,
	reader: 1,
}

function useCollaborators(covalue: CoValue | null | undefined): {
	collaborators: Collaborator[]
	isLoading: boolean
} {
	let t = useIntl()
	let [collaborators, setCollaborators] = useState<Collaborator[]>([])
	let [loadedFor, setLoadedFor] = useState<CoValue | null | undefined>(
		undefined,
	)

	useEffect(() => {
		let cancelled = false

		loadCollaborators(covalue, t).then(results => {
			if (!cancelled) {
				setCollaborators(results)
				setLoadedFor(covalue)
			}
		})

		return () => {
			cancelled = true
		}
	}, [covalue, t])

	let isLoading = loadedFor !== covalue

	return { collaborators, isLoading }
}

async function loadCollaborators(
	covalue: CoValue | null | undefined,
	t: ReturnType<typeof useIntl>,
): Promise<Collaborator[]> {
	if (!covalue) return []

	let owner = covalue.$jazz.owner
	if (!(owner instanceof Group)) return []

	let results: Collaborator[] = []

	// Check direct members (admin = owner)
	for (let member of owner.members) {
		if (
			member.role === "admin" ||
			member.role === "writer" ||
			member.role === "reader"
		) {
			let account = member.account
			let name = t("common.unknown")
			if (account?.$isLoaded) {
				let profile = await account.$jazz.ensureLoaded({
					resolve: { profile: true },
				})
				name = profile.profile?.name ?? t("common.unknown")
			}
			results.push({
				id: member.id,
				role: member.role,
				name,
			})
		}
	}

	// Check parent groups (InviteGroups) for collaborators who joined via invite
	for (let inviteGroup of owner.getParentGroups()) {
		for (let member of inviteGroup.members) {
			// Skip admins - they're invite creators, not collaborators
			if (member.role === "admin") continue
			if (member.role === "writer" || member.role === "reader") {
				let account = member.account
				let name = t("common.unknown")
				if (account?.$isLoaded) {
					let profile = await account.$jazz.ensureLoaded({
						resolve: { profile: true },
					})
					name = profile.profile?.name ?? t("common.unknown")
				}
				results.push({
					id: member.id,
					role: member.role,
					name,
				})
			}
		}
	}

	return dedupeByHighestRole(results)
}

function dedupeByHighestRole(collaborators: Collaborator[]): Collaborator[] {
	let byId = new Map<string, Collaborator>()
	for (let c of collaborators) {
		let existing = byId.get(c.id)
		if (!existing || roleRank[c.role] > roleRank[existing.role]) {
			byId.set(c.id, c)
		}
	}
	return Array.from(byId.values())
}
