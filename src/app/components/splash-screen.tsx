import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { TypographyH1 } from "#shared/ui/typography"

export { SplashScreen, SplashScreenStatic, useSplashDelay }

declare global {
	interface Window {
		__pageLoadTime?: number
	}
}

function useSplashDelay(minDurationMs = 700) {
	let [ready, setReady] = useState(() => {
		let loadTime = window.__pageLoadTime ?? Date.now()
		let elapsed = Date.now() - loadTime
		return elapsed >= minDurationMs
	})

	useEffect(() => {
		if (ready) return

		let loadTime = window.__pageLoadTime ?? Date.now()
		let elapsed = Date.now() - loadTime
		let remaining = Math.max(0, minDurationMs - elapsed)

		let timer = setTimeout(() => setReady(true), remaining)
		return () => clearTimeout(timer)
	}, [minDurationMs, ready])

	return ready
}

function SplashScreenStatic() {
	useEffect(() => {
		document.getElementById("splash")?.remove()
	}, [])

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<img src="/app/icons/icon-192x192.png" className="size-24 rounded-lg" />
			<TypographyH1>Tilly</TypographyH1>
		</div>
	)
}

function SplashScreen({ show }: { show?: boolean }) {
	return (
		<AnimatePresence>
			{show !== false && (
				<motion.div
					className="bg-background fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center gap-4"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
				>
					<motion.img
						src="/app/icons/icon-192x192.png"
						className="size-24 rounded-lg"
						layoutId="logo"
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					/>
					<motion.div
						layoutId="title"
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					>
						<TypographyH1>Tilly</TypographyH1>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
