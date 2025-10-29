import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button } from "#shared/ui/button"
import { TypographyH1, TypographyLarge } from "#shared/ui/typography"
import { useAppStore } from "#app/lib/store"
import { getSignInUrl } from "#app/lib/auth-utils"

export const Route = createFileRoute("/")({
	component: WelcomeIndex,
})

function WelcomeIndex() {
	let navigate = useNavigate()
	let setTourSkipped = useAppStore(state => state.setTourSkipped)

	function handleSkip() {
		setTourSkipped(true)
		navigate({ to: "/people" })
	}

	function handleSignIn() {
		setTourSkipped(true)
		window.location.href = getSignInUrl("/")
	}

	return (
		<div className="flex h-[66vh] flex-col items-center justify-center gap-6">
			<div className="flex items-center gap-4">
				<img src="/app/icons/icon-192x192.png" className="size-24 rounded-lg" />
				<TypographyH1>Tilly</TypographyH1>
			</div>

			<TypographyLarge>Welcome to your relationship journal!</TypographyLarge>

			<Button asChild>
				<Link to="/tour">Take the Tour</Link>
			</Button>

			<div className="inline-flex items-center gap-3">
				<Button variant="secondary" onClick={handleSkip}>
					Skip
				</Button>

				<Button variant="secondary" onClick={handleSignIn}>
					Sign In
				</Button>
			</div>
		</div>
	)
}
