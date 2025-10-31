import {
	createFileRoute,
	Link,
	useNavigate,
	redirect,
} from "@tanstack/react-router"
import { motion } from "motion/react"
import { Button } from "#shared/ui/button"
import { TypographyH1, TypographyLarge } from "#shared/ui/typography"
import { useAppStore } from "#app/lib/store"
import { getSignInUrl } from "#app/lib/auth-utils"
import { T } from "#shared/intl/setup"

export const Route = createFileRoute("/")({
	loader: () => {
		let tourSkipped = useAppStore.getState().tourSkipped
		console.log("Loader: tourSkipped =", tourSkipped)
		if (tourSkipped) {
			throw redirect({ to: "/people" })
		}
		return null
	},
	component: WelcomeIndex,
})

function WelcomeIndex() {
	let navigate = useNavigate()
	let tourSkipped = useAppStore(state => state.tourSkipped)
	let setTourSkipped = useAppStore(state => state.setTourSkipped)

	console.log("Component: tourSkipped =", tourSkipped)

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
					<TypographyH1>
						<T k="welcome.title" />
					</TypographyH1>
				</motion.div>
			</div>

			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.4, duration: 0.4 }}
			>
				<TypographyLarge>
					<T k="welcome.subtitle" />
				</TypographyLarge>
			</motion.div>

			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.5, duration: 0.4 }}
			>
				<Button asChild>
					<Link to="/tour">
						<T k="welcome.takeTour" />
					</Link>
				</Button>
			</motion.div>

			<motion.div
				className="inline-flex items-center gap-3"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.5, duration: 0.4 }}
			>
				<Button variant="secondary" onClick={handleSkip}>
					<T k="welcome.skip" />
				</Button>

				<Button variant="secondary" onClick={handleSignIn}>
					<T k="welcome.signIn" />
				</Button>
			</motion.div>
		</div>
	)
}
