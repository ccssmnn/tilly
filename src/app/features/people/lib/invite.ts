export type { InviteData }
export { parseInviteHash, getOrRestoreInviteData }

let PENDING_INVITE_KEY = "tilly:pending-invite"

type InviteData = {
	personId: string
	inviteGroupId: string
	inviteSecret: string
}

function parseInviteHash(hash: string): InviteData | null {
	// Format: #/person/{personId}/invite/{inviteGroupId}/{inviteSecret}
	let match = hash.match(
		/^#\/person\/(co_[^/]+)\/invite\/(co_[^/]+)\/(inviteSecret_[^/]+)$/,
	)
	if (!match) return null
	return {
		personId: match[1],
		inviteGroupId: match[2],
		inviteSecret: match[3],
	}
}

function getOrRestoreInviteData(): InviteData | null {
	if (typeof window === "undefined") return null

	let currentHash = window.location.hash
	let parsed = parseInviteHash(currentHash)
	if (parsed) {
		localStorage.setItem(PENDING_INVITE_KEY, currentHash)
		return parsed
	}

	let pending = localStorage.getItem(PENDING_INVITE_KEY)
	if (pending) {
		window.location.hash = pending
		return parseInviteHash(pending)
	}

	return null
}
