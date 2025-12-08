import { createFileRoute, Link } from "@tanstack/react-router"
import { useIsAuthenticated, useAccount } from "jazz-tools/react"
import { Group, type ID } from "jazz-tools"
import { T, useIntl } from "#shared/intl/setup"
import { ExclamationTriangle } from "react-bootstrap-icons"
import { Person, UserAccount } from "#shared/schema/user"
import { toast } from "sonner"
import { useState, useEffect } from "react"
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

export const Route = createFileRoute("/_app/invite")({
	loader: () => {
		let inviteData = getOrRestoreInviteData()
		return { inviteData }
	},
	component: InviteScreen,
})

let PENDING_INVITE_KEY = "tilly:pending-invite"

type InviteData = {
	personId: string
	inviteGroupId: string
	inviteSecret: string
}

function InviteScreen() {
	let { inviteData } = Route.useLoaderData()
	let isAuthenticated = useIsAuthenticated()

	if (!inviteData) {
		return <InvalidInviteState />
	}

	if (!isAuthenticated) {
		return <SignInPromptState />
	}

	return <AcceptInviteHandler inviteData={inviteData} />
}

function AcceptInviteHandler({ inviteData }: { inviteData: InviteData }) {
	let { me } = Route.useRouteContext()
	let account = useAccount(UserAccount, { resolve: { root: { people: true } } })
	let navigate = Route.useNavigate()
	let t = useIntl()
	let [error, setError] = useState("")
	let [isRevoked, setIsRevoked] = useState(false)
	let [isProcessing, setIsProcessing] = useState(true)

	useEffect(() => {
		async function acceptInvite() {
			if (!me || !account.$isLoaded) return

			try {
				// Accept the invite to join InviteGroup
				await me.acceptInvite(
					inviteData.inviteGroupId as ID<Group>,
					inviteData.inviteSecret as `inviteSecret_z${string}`,
					Group,
				)

				clearPendingInvite()

				// Now try to load the person - if access was revoked, this will fail
				let person = await Person.load(
					inviteData.personId as ID<typeof Person>,
					{ resolve: { avatar: true } },
				)

				if (!person?.$isLoaded) {
					setIsRevoked(true)
					setIsProcessing(false)
					return
				}

				// Check if user already has this person
				let alreadyHas = account.root.people.some(
					p => p?.$jazz.id === inviteData.personId,
				)

				if (!alreadyHas) {
					account.root.people.$jazz.push(person)
					toast.success(t("invite.success", { name: person.name }))
				}

				navigate({
					to: "/people/$personID",
					params: { personID: inviteData.personId },
				})
			} catch (err) {
				console.error("Failed to accept invite:", err)
				setError(t("invite.error.failed"))
				setIsProcessing(false)
			}
		}

		acceptInvite()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [me, account.$isLoaded, inviteData, navigate, t])

	if (isRevoked) {
		return <RevokedInviteState />
	}

	if (error) {
		return <ErrorState message={error} />
	}

	if (isProcessing) {
		return <LoadingState />
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

function clearPendingInvite() {
	localStorage.removeItem(PENDING_INVITE_KEY)
}
