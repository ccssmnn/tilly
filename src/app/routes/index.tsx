import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { motion } from "motion/react"
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
				<motion.img
					src="/app/icons/icon-192x192.png"
					className="size-24 rounded-lg"
					layoutId="logo"
				/>
				<motion.div layoutId="title">
					<TypographyH1>Tilly</TypographyH1>
				</motion.div>
			</div>

			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.4, duration: 0.4 }}
			>
				<TypographyLarge>Welcome to your relationship journal!</TypographyLarge>
			</motion.div>

			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.5, duration: 0.4 }}
			>
				<Button asChild>
					<Link to="/tour">Take the Tour</Link>
				</Button>
			</motion.div>

			<motion.div
				className="inline-flex items-center gap-3"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.5, duration: 0.4 }}
			>
				<Button variant="secondary" onClick={handleSkip}>
					Skip
				</Button>

				<Button variant="secondary" onClick={handleSignIn}>
					Sign In
				</Button>
			</motion.div>
		</div>
	)
}
