import { useState, useEffect, useRef } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useIsAuthenticated, useAccount } from "jazz-tools/react"
import { Group, type ID } from "jazz-tools"
import { useIntl } from "#shared/intl/setup"
import { Person, UserAccount } from "#shared/schema/user"
import { toast } from "sonner"
import type { InviteData } from "../lib/invite"

let PENDING_INVITE_KEY = "tilly:pending-invite"

function clearPendingInvite() {
	localStorage.removeItem(PENDING_INVITE_KEY)
}

export { useAcceptInvite }

type AcceptInviteState =
	| { status: "invalid" }
	| { status: "unauthenticated" }
	| { status: "processing" }
	| { status: "revoked" }
	| { status: "error"; message: string }

function useAcceptInvite(inviteData: InviteData | null): AcceptInviteState {
	let account = useAccount(UserAccount, {
		resolve: { root: { people: true } },
	})
	let isAuthenticated = useIsAuthenticated()
	let navigate = useNavigate()
	let t = useIntl()
	let [state, setState] = useState<AcceptInviteState>(() => {
		if (!inviteData) return { status: "invalid" }
		if (!isAuthenticated) return { status: "unauthenticated" }
		return { status: "processing" }
	})
	let acceptingRef = useRef(false)

	useEffect(() => {
		if (!inviteData || !isAuthenticated || !account.$isLoaded) return
		if (acceptingRef.current) return
		acceptingRef.current = true

		let narrowedAccount = account
		let data = inviteData

		async function acceptInvite() {
			try {
				await narrowedAccount.acceptInvite(
					data.inviteGroupId as ID<Group>,
					data.inviteSecret as `inviteSecret_z${string}`,
					Group,
				)

				clearPendingInvite()

				let person = await Person.load(data.personId as ID<typeof Person>, {
					resolve: { avatar: true },
				})

				if (!person?.$isLoaded) {
					setState({ status: "revoked" })
					return
				}

				let freshAccount = await UserAccount.load(narrowedAccount.$jazz.id, {
					resolve: { root: { people: true } },
				})
				let alreadyHas =
					freshAccount?.$isLoaded &&
					freshAccount.root.people.some(p => p?.$jazz.id === data.personId)

				if (!alreadyHas) {
					narrowedAccount.root.people.$jazz.push(person)
					toast.success(t("invite.success", { name: person.name }))
				}

				navigate({
					to: "/people/$personID",
					params: { personID: data.personId },
				})
			} catch (err) {
				console.error("Failed to accept invite:", err)
				setState({ status: "error", message: t("invite.error.failed") })
			}
		}

		acceptInvite()
	}, [account.$isLoaded, isAuthenticated, inviteData, navigate, t, account])

	return state
}
