import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { SignInButton } from "@clerk/clerk-react"
import { motion } from "motion/react"
import { Button } from "#shared/ui/button"
import { TypographyH1, TypographyLead } from "#shared/ui/typography"
import { useAppStore } from "#app/lib/store"
import { T } from "#shared/intl/setup"
import {
	SkipForwardFill,
	LightbulbFill,
	PersonCircle,
} from "react-bootstrap-icons"

export const Route = createFileRoute("/")({
	loader: () => {
		let tourSkipped = useAppStore.getState().tourSkipped
		if (tourSkipped) {
			throw redirect({ to: "/people" })
		}
		return null
	},
	component: WelcomeIndex,
})

function WelcomeIndex() {
	let setTourSkipped = useAppStore(state => state.setTourSkipped)

	return (
		<div
			className="absolute inset-0"
			style={{
				paddingTop: "max(1.5rem, env(safe-area-inset-top))",
				paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
				paddingRight: "max(0.75rem, env(safe-area-inset-right))",
				paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
			}}
		>
			<div className="relative h-full w-full">
				<div className="items-top absolute inset-x-0 top-0 flex gap-4">
					<div className="flex-1" />
					<motion.div
						layoutId="skip"
						initial={{ y: 12, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.4 }}
					>
						<Button variant="outline" asChild>
							<Link to="/people" onClick={() => setTourSkipped(true)}>
								<SkipForwardFill />
								<T k="welcome.skip" />
							</Link>
						</Button>
					</motion.div>
				</div>
				<div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
					<div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
						<div className="inline-flex items-center gap-4">
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
							initial={{ y: 12, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.4, duration: 0.4 }}
						>
							<TypographyLead>
								<T k="welcome.subtitle" />
							</TypographyLead>
						</motion.div>
						<motion.div
							initial={{ y: 12, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.4, duration: 0.4 }}
							className="flex items-center gap-3"
						>
							<Button asChild className="h-12">
								<Link to="/tour">
									<LightbulbFill />
									<T k="welcome.takeTour" />
								</Link>
							</Button>
							<SignInButton mode="redirect" forceRedirectUrl="/app/people">
								<Button
									variant="secondary"
									onClick={() => setTourSkipped(true)}
									className="h-12"
								>
									<PersonCircle />
									<T k="welcome.signIn" />
								</Button>
							</SignInButton>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	)
}
