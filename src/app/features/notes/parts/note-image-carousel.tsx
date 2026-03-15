import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Note } from "#shared/schema/user"
import { co } from "jazz-tools"
import { Image as JazzImage, useCoState } from "jazz-tools/react"
import { Dialog, DialogContent, DialogTitle } from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { cn } from "#app/lib/utils"

export { NoteImageCarousel }

type ImageItem = co.loaded<ReturnType<typeof co.image>>
type Direction = "left" | "right" | undefined

function NoteImageCarousel({
	note,
	selectedIndex,
	open,
	onClose,
}: {
	note: co.loaded<typeof Note>
	selectedIndex: number
	open: boolean
	onClose: () => void
}) {
	let loadedNote = useCoState(Note, note.$jazz.id, {
		resolve: { images: { $each: true } },
	})

	let imageArray =
		loadedNote?.$isLoaded && loadedNote.images?.$isLoaded
			? Array.from(loadedNote.images.values()).filter(
					(img): img is ImageItem => img?.$isLoaded === true,
				)
			: []

	return (
		<ImageCarousel
			images={imageArray}
			selectedIndex={selectedIndex}
			open={open && imageArray.length > 0}
			onClose={onClose}
		/>
	)
}

function ImageCarousel({
	images,
	selectedIndex,
	open,
	onClose,
}: {
	images: ImageItem[]
	selectedIndex: number
	open: boolean
	onClose: () => void
}) {
	let [currentIndex, setCurrentIndex] = useState(selectedIndex)
	let [prevSelectedIndex, setPrevSelectedIndex] = useState(selectedIndex)
	if (selectedIndex !== prevSelectedIndex) {
		setPrevSelectedIndex(selectedIndex)
		setCurrentIndex(selectedIndex)
	}

	let [direction, setDirection] = useState<Direction>()
	let prefersReducedMotion = useReducedMotion()

	function handlePrevious() {
		setDirection("left")
		setTimeout(
			() =>
				setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)),
			10,
		)
	}

	function handleNext() {
		setDirection("right")
		setTimeout(
			() =>
				setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)),
			10,
		)
	}

	function handleDotClick(index: number) {
		setDirection(index > currentIndex ? "right" : "left")
		setTimeout(() => setCurrentIndex(index), 10)
	}

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowRight") handleNext()
			else if (event.key === "ArrowLeft") handlePrevious()
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	})

	let currentImage = images[currentIndex]
	if (!currentImage) return null

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="h-[90dvh] md:w-[90dvw] md:max-w-none">
				<DialogTitle>Image viewer</DialogTitle>
				<div className="relative h-full w-full">
					<AnimatePresence mode="wait" custom={direction}>
						<motion.div
							key={currentIndex}
							custom={direction}
							initial="enter"
							animate="center"
							exit="exit"
							drag="x"
							dragConstraints={{ left: 0, right: 0 }}
							dragElastic={0.2}
							onDragEnd={(_, info) => {
								let swipeThreshold = 50
								if (info.offset.x > swipeThreshold) handlePrevious()
								else if (info.offset.x < -swipeThreshold) handleNext()
							}}
							variants={{
								enter: (dir: Direction) => ({
									opacity: prefersReducedMotion ? 1 : 0,
									x: prefersReducedMotion
										? 0
										: { left: -12, right: 12, _: 0 }[dir ?? "_"],
								}),
								center: { opacity: 1, x: 0 },
								exit: (dir: Direction) => ({
									opacity: prefersReducedMotion ? 1 : 0,
									x: prefersReducedMotion
										? 0
										: { left: 12, right: -12, _: 0 }[dir ?? "_"],
								}),
							}}
							transition={{
								duration: prefersReducedMotion ? 0 : 0.075,
								ease: "easeOut",
							}}
							style={{ touchAction: "none" }}
							className="absolute inset-x-0 top-0 bottom-24 flex items-center justify-center"
						>
							<JazzImage
								imageId={currentImage.$jazz.id}
								alt=""
								className="max-h-full max-w-full rounded-lg object-contain"
							/>
						</motion.div>
					</AnimatePresence>

					{images.length > 1 && (
						<div className="absolute inset-x-0 bottom-0 flex h-24 items-center justify-center gap-4">
							<Button onClick={handlePrevious} size="sm" variant="secondary">
								<ChevronLeft />
								<T k="navigation.previous" />
							</Button>
							<div className="flex gap-2">
								{images.map((_, index) => (
									<button
										type="button"
										key={index}
										onClick={() => handleDotClick(index)}
										aria-label={`Go to image ${index + 1}`}
										className="relative size-11 rounded-full"
									>
										<span
											className={cn(
												"absolute top-1/2 left-1/2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,background-color] duration-150",
												currentIndex === index
													? "bg-foreground w-6"
													: "bg-foreground/50 pointer-fine:hover:bg-foreground/75 w-2",
											)}
										/>
									</button>
								))}
							</div>
							<Button onClick={handleNext} variant="secondary">
								<T k="navigation.next" />
								<ChevronRight />
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
