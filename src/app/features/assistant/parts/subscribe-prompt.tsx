import { SignInButton, SignUpButton } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { Button } from "#shared/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { T } from "#shared/intl/setup"

export { SubscribePrompt }

function SubscribePrompt({ mode }: { mode: "signedOut" | "plusRequired" }) {
	let isSignedOut = mode === "signedOut"

	return (
		<Empty className="min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-6rem)]">
			<EmptyHeader>
				<EmptyMedia>
					<Avatar className="size-20">
						<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly" />
						<AvatarFallback>T</AvatarFallback>
					</Avatar>
				</EmptyMedia>
				<EmptyTitle>
					<T
						k={
							isSignedOut
								? "assistant.signedOut.title"
								: "assistant.subscribe.title"
						}
					/>
				</EmptyTitle>
				<EmptyDescription>
					<T
						k={
							isSignedOut
								? "assistant.signedOut.description"
								: "assistant.subscribe.description"
						}
					/>
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				{isSignedOut ? (
					<div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
						<SignInButton mode="redirect" forceRedirectUrl="/app/assistant">
							<Button className="w-full sm:w-auto">
								<T k="auth.signIn.button" />
							</Button>
						</SignInButton>
						<SignUpButton mode="redirect" forceRedirectUrl="/app/assistant">
							<Button variant="outline" className="w-full sm:w-auto">
								<T k="auth.signUp.button" />
							</Button>
						</SignUpButton>
					</div>
				) : (
					<Button>
						<Link to="/settings">
							<T k="assistant.subscribe.settings" />
						</Link>
					</Button>
				)}
			</EmptyContent>
		</Empty>
	)
}
