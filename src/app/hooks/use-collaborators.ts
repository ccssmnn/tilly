import { useState, useEffect } from "react"
import { Group, type CoValue } from "jazz-tools"
import { useIntl } from "#shared/intl/setup"

export { useCollaborators }
export type { Collaborator }

type Collaborator = {
	id: string
	role: "admin" | "writer" | "reader" | "writeOnly"
	name: string
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
	return results
}
