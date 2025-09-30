import { useEffect, useRef } from "react"
import { cn } from "#app/lib/utils"

export { PhoneMedia }
export type { PhoneMediaSource }

type BaseSource = {
	aspectRatio?: `${number} / ${number}`
	fit?: "cover" | "contain"
}

type ImageSource = BaseSource & {
	kind: "image"
	src: string
	alt: string
	loading?: "lazy" | "eager"
}

type VideoSource = BaseSource & {
	kind: "video"
	src: string
	poster: {
		src: string
		alt: string
	}
	autoPlay?: boolean
	loop?: boolean
	muted?: boolean
}

type PhoneMediaSource = ImageSource | VideoSource

interface Props {
	media: PhoneMediaSource
	className?: string
}

function PhoneMedia({ media, className }: Props) {
	let aspectRatio = media.aspectRatio ?? "215 / 466"
	let videoRef = useRef<HTMLVideoElement | null>(null)
	let posterRef = useRef<HTMLImageElement | null>(null)
	let fitClass = media.fit === "contain" ? "object-contain" : "object-cover"

	useEffect(() => {
		if (media.kind !== "video") return
		let videoElement = videoRef.current
		let posterElement = posterRef.current
		if (!videoElement || !posterElement) return

		let handleCanPlay = () => {
			videoElement.style.opacity = "1"
			posterElement.style.opacity = "0"
			videoElement.play().catch(() => {
				videoElement.style.opacity = "0"
				posterElement.style.opacity = "1"
			})
		}

		let observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (!entry.isIntersecting) return
					videoElement.addEventListener("canplaythrough", handleCanPlay, {
						once: true,
					})
					videoElement.load()
					observer.unobserve(entry.target)
				})
			},
			{ threshold: 0.4 },
		)

		observer.observe(videoElement)

		return () => {
			observer.disconnect()
			videoElement.removeEventListener("canplaythrough", handleCanPlay)
		}
	}, [media])

	return (
		<div
			className={cn(
				"relative mx-auto w-full max-w-[18rem] overflow-hidden rounded-3xl shadow-xl sm:max-w-[19rem] md:max-w-[21rem] lg:max-w-[22rem]",
				className,
			)}
			style={{ aspectRatio }}
		>
			{media.kind === "image" ? (
				<img
					alt={media.alt}
					src={media.src}
					loading={media.loading}
					className={cn("absolute inset-0 h-full w-full", fitClass)}
				/>
			) : (
				<>
					<img
						ref={posterRef}
						alt={media.poster.alt}
						src={media.poster.src}
						loading="lazy"
						className={cn(
							"absolute inset-0 h-full w-full transition-opacity duration-300",
							fitClass,
						)}
					/>
					<video
						ref={videoRef}
						className={cn(
							"absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300",
							fitClass,
						)}
						muted={media.muted ?? true}
						loop={media.loop ?? true}
						playsInline
						autoPlay={media.autoPlay ?? true}
						preload="metadata"
					>
						<source src={media.src} type="video/mp4" />
					</video>
				</>
			)}
		</div>
	)
}
