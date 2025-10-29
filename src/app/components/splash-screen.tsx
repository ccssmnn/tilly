import { motion } from "motion/react"

export function SplashScreen() {
	return (
		<motion.div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<motion.img
				src="/app/icons/icon-192x192.png"
				className="h-24 w-24 rounded-lg"
				layoutId="logo"
			/>
			<motion.h1 className="text-3xl font-semibold" layoutId="title">
				Tilly
			</motion.h1>
		</motion.div>
	)
}
