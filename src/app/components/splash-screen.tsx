import { TypographyH1 } from "#shared/ui/typography"
import { motion } from "motion/react"

export function SplashScreen() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<motion.img
				src="/app/icons/icon-192x192.png"
				className="size-24 rounded-lg"
				layoutId="logo"
			/>
			<motion.div layoutId="title">
				<TypographyH1>Tilly</TypographyH1>
			</motion.div>
		</div>
	)
}
