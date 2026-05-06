import { Link } from "@tanstack/react-router"
import { SignInButton, SignUpButton } from "@clerk/clerk-react"
import { T } from "#shared/intl/setup"
import { ExclamationTriangle } from "react-bootstrap-icons"
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

export {
	InviteLoadingState,
	InvalidInviteState,
	RevokedInviteState,
	InviteErrorState,
	SignInPromptState,
}

function InviteLoadingState() {
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
					<Button>
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
					<Button>
						<Link to="/people">
							<T k="invite.error.invalid.action" />
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function InviteErrorState({ message }: { message: string }) {
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
					<Button>
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
					<SignInButton mode="redirect" forceRedirectUrl="/app/invite">
						<Button className="w-full">
							<T k="auth.signIn.button" />
						</Button>
					</SignInButton>
					<SignUpButton mode="redirect" forceRedirectUrl="/app/invite">
						<Button variant="outline" className="w-full">
							<T k="auth.signUp.button" />
						</Button>
					</SignUpButton>
				</EmptyContent>
			</Empty>
		</div>
	)
}
