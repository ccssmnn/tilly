import { createFileRoute, Link } from "@tanstack/react-router"
import { useAcceptInvite, useIsAuthenticated } from "jazz-tools/react"
import { T, useIntl } from "#shared/intl/setup"
import { ExclamationTriangle } from "react-bootstrap-icons"
import { Person, UserAccount, InviteBridge } from "#shared/schema/user"
import { toast } from "sonner"
import { useState } from "react"
import { Button } from "#shared/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { Spinner } from "#shared/ui/spinner"
import { getSignInUrl, getSignUpUrl } from "#app/lib/auth-utils"
import type { ID } from "jazz-tools"

export const Route = createFileRoute("/_app/invite")({
	loader: () => {
		let inviteHash = getOrRestoreInviteHash()
		return { inviteHash }
	},
	component: InviteScreen,
})

let PENDING_INVITE_KEY = "tilly:pending-invite"

function InviteScreen() {
	let { inviteHash } = Route.useLoaderData()
	let isAuthenticated = useIsAuthenticated()

	if (!inviteHash) {
		return <InvalidInviteState />
	}

	if (!isAuthenticated) {
		return <SignInPromptState />
	}

	return <AcceptInviteHandler />
}

function AcceptInviteHandler() {
	let { me } = Route.useRouteContext()
	let navigate = Route.useNavigate()
	let t = useIntl()
	let [error, setError] = useState("")
	let [isRevoked, setIsRevoked] = useState(false)

	useAcceptInvite({
		invitedObjectSchema: InviteBridge,
		forValueHint: "invite",
		onAccept: async bridgeId => {
			clearPendingInvite()

			// me is guaranteed by loader check, but TypeScript doesn't know
			if (!me) {
				setError(t("invite.error.failed"))
				return
			}

			// Load the bridge to get personId
			let bridge = await InviteBridge.load(bridgeId)
			if (!bridge?.$isLoaded || !bridge.personId) {
				setError(t("invite.error.failed"))
				return
			}

			let personId = bridge.personId as ID<typeof Person>

			// Try to load the person - if revoked, this will fail
			let person = await Person.load(personId, { resolve: { avatar: true } })
			if (!person?.$isLoaded) {
				// Invite was revoked - user joined InviteGroup but it no longer has access
				setIsRevoked(true)
				return
			}

			let account = await UserAccount.load(me.$jazz.id, {
				resolve: { root: { people: true } },
			})
			if (!account.$isLoaded) {
				setError(t("invite.error.failed"))
				return
			}

			// Check if user already has this person
			let alreadyHas = account.root.people.some(p => p?.$jazz.id === personId)

			if (!alreadyHas) {
				account.root.people.$jazz.push(person)
				toast.success(t("invite.success", { name: person.name }))
			}
			navigate({ to: "/people/$personID", params: { personID: personId } })
		},
	})

	if (isRevoked) {
		return <RevokedInviteState />
	}

	if (error) {
		return <ErrorState message={error} />
	}

	return <LoadingState />
}

function LoadingState() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Spinner className="size-8" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="invite.accepting" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="invite.loading.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function InvalidInviteState() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ExclamationTriangle className="size-8" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="invite.error.invalid.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="invite.error.invalid.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild>
						<Link to="/people">
							<T k="invite.error.invalid.action" />
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function RevokedInviteState() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ExclamationTriangle className="size-8" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="invite.error.revoked.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="invite.error.revoked.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild>
						<Link to="/people">
							<T k="invite.error.invalid.action" />
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function ErrorState({ message }: { message: string }) {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ExclamationTriangle className="size-8" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="invite.error.failed.title" />
					</EmptyTitle>
					<EmptyDescription>{message}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild>
						<Link to="/people">
							<T k="invite.error.invalid.action" />
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function SignInPromptState() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<Empty>
				<EmptyHeader>
					<EmptyTitle>
						<T k="invite.signIn.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="invite.signIn.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild className="w-full">
						<a href={getSignInUrl("/app/invite")}>
							<T k="auth.signIn.button" />
						</a>
					</Button>
					<Button variant="outline" asChild className="w-full">
						<a href={getSignUpUrl("/app/invite")}>
							<T k="auth.signUp.button" />
						</a>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function getOrRestoreInviteHash(): string | null {
	if (typeof window === "undefined") return null

	let currentHash = window.location.hash
	if (currentHash.includes("/invite/")) {
		localStorage.setItem(PENDING_INVITE_KEY, currentHash)
		return currentHash
	}

	let pending = localStorage.getItem(PENDING_INVITE_KEY)
	if (pending) {
		window.location.hash = pending
		return pending
	}

	return null
}

function clearPendingInvite() {
	localStorage.removeItem(PENDING_INVITE_KEY)
}
