import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "#shared/ui/button"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import {
	Mic,
	StopCircle,
	Play,
	PauseFill,
	Send,
	ArrowClockwise,
} from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"

export { VoiceMessageDialog }
export type { VoiceMessageDialogProps }

type VoiceMessageDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onTranscriptionComplete: (text: string) => void
}

type RecordingState = "idle" | "recording" | "stopped"

let MAX_DURATION = 10 * 60 * 1000

function VoiceMessageDialog({
	open,
	onOpenChange,
	onTranscriptionComplete,
}: VoiceMessageDialogProps) {
	let audioRef = useRef<HTMLAudioElement | null>(null)
	let recordingProgressRef = useRef<HTMLDivElement | null>(null)
	let playbackProgressRef = useRef<HTMLDivElement | null>(null)
	let [state, setState] = useState<RecordingState>("idle")
	let [audioUrl, setAudioUrl] = useState<string | null>(null)
	let [error, setError] = useState<string | null>(null)
	let [finalDuration, setFinalDuration] = useState(0)

	let { startRecording, stopRecording, cleanup, duration, recordingError } =
		useVoiceRecorder({
			onRecordingComplete: (url, finalDuration) => {
				setAudioUrl(url)
				setFinalDuration(finalDuration)
				setState("stopped")
			},
			onError: err => setError(err),
			onRecordingStart: () => setState("recording"),
			onAudioLevel: level => {
				if (recordingProgressRef.current) {
					recordingProgressRef.current.style.width = `${Math.min(100, level)}%`
				}
			},
		})

	let { isPlaying, setIsPlaying, handlePlayPause, setupPlaybackAnalyser } =
		useVoicePlayback({
			audioRef,
			onAudioLevel: level => {
				if (playbackProgressRef.current) {
					playbackProgressRef.current.style.width = `${Math.min(100, level)}%`
				}
			},
		})

	let reset = useCallback(() => {
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl)
		}
		setAudioUrl(null)
		setState("idle")
		setError(null)
		cleanup()
	}, [audioUrl, cleanup])

	useEffect(() => {
		return cleanup
	}, [cleanup])

	useEffect(() => {
		if (!open) {
			reset()
		}
	}, [open, reset])

	useEffect(() => {
		if (!audioRef.current || !audioUrl) return
		audioRef.current.src = audioUrl
	}, [audioUrl])

	useEffect(() => {
		if (!audioRef.current || !audioUrl) return

		let audio = audioRef.current
		let handleEnded = () => setIsPlaying(false)
		let handlePlay = () => {
			// Small delay to ensure audio is actually playing
			setTimeout(() => setupPlaybackAnalyser(), 100)
		}
		let handlePause = () => setIsPlaying(false)

		audio.addEventListener("ended", handleEnded)
		audio.addEventListener("play", handlePlay)
		audio.addEventListener("pause", handlePause)

		return () => {
			audio.removeEventListener("ended", handleEnded)
			audio.removeEventListener("play", handlePlay)
			audio.removeEventListener("pause", handlePause)
		}
	}, [audioUrl, setupPlaybackAnalyser, setIsPlaying])

	useEffect(() => {
		if (recordingError) setError(recordingError)
	}, [recordingError])

	let handleSendRecording = async () => {
		if (!audioUrl) return

		try {
			let response = await fetch(audioUrl)
			let blob = await response.blob()

			let formData = new FormData()
			formData.append("audio", blob, "recording.webm")

			let apiResponse = await fetch("/api/speech-to-text", {
				method: "POST",
				body: formData,
			})

			if (!apiResponse.ok) {
				throw new Error(`Transcription failed: ${apiResponse.statusText}`)
			}

			let result = await apiResponse.json()
			let transcription = result.transcription || ""

			onTranscriptionComplete(transcription)
			onOpenChange(false)
			reset()
		} catch (err) {
			console.error("Transcription error:", err)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				titleSlot={
					<div className="flex items-center gap-2">
						<Mic className="size-5" />
						<h2 className="text-lg font-semibold">
							<T k="assistant.voiceRecording.title" />
						</h2>
					</div>
				}
			>
				<div className="space-y-4">
					{error && (
						<div className="bg-destructive/15 text-destructive rounded-lg p-3 text-sm">
							{error}
						</div>
					)}

					{state === "recording" && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="size-2 animate-pulse rounded-full bg-red-500" />
									<span className="text-muted-foreground text-sm">
										<T k="assistant.voiceRecording.recording" />
									</span>
								</div>
								<div className="font-mono text-sm tabular-nums">
									{formatTime(duration)}
								</div>
							</div>
							<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
								<div
									ref={recordingProgressRef}
									className="bg-primary h-full"
									style={{ width: "0%" }}
								/>
							</div>
						</div>
					)}

					{state === "stopped" && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{isPlaying && (
										<>
											<div className="bg-primary size-2 animate-pulse rounded-full" />
											<span className="text-muted-foreground text-sm">
												Playing...
											</span>
										</>
									)}
									{!isPlaying && (
										<span className="text-muted-foreground text-sm">
											Ready to send
										</span>
									)}
								</div>
								<div className="font-mono text-sm tabular-nums">
									{formatTime(finalDuration)}
								</div>
							</div>
							<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
								<div
									ref={playbackProgressRef}
									className="bg-primary h-full"
									style={{ width: "0%" }}
								/>
							</div>
						</div>
					)}

					<div className="space-y-3">
						{state === "idle" && (
							<Button className="h-12 w-full" onClick={startRecording}>
								<Mic className="size-4" />
								<T k="assistant.voiceRecording.start" />
							</Button>
						)}

						{state === "recording" && (
							<Button
								className="h-12 w-full"
								onClick={stopRecording}
								variant="destructive"
							>
								<StopCircle className="size-4" />
								<T k="assistant.voiceRecording.stop" />
							</Button>
						)}

						{state === "stopped" && (
							<>
								<div className="flex items-center gap-3">
									<Button
										className="h-12 flex-1"
										onClick={handlePlayPause}
										variant="outline"
									>
										{isPlaying ? (
											<PauseFill className="size-4" />
										) : (
											<Play className="size-4" />
										)}
										{isPlaying ? "Pause" : "Play"}
									</Button>
									<Button
										className="h-12 flex-1"
										onClick={reset}
										variant="outline"
									>
										<ArrowClockwise className="size-4" />
										Reset
									</Button>
								</div>
								<Button className="h-12 w-full" onClick={handleSendRecording}>
									<Send className="size-4" />
									<T k="assistant.voiceRecording.send" />
								</Button>
							</>
						)}
					</div>
				</div>

				<audio ref={audioRef} className="hidden" />
			</DialogContent>
		</Dialog>
	)
}

function useVoiceRecorder({
	onRecordingComplete,
	onError,
	onRecordingStart,
	onAudioLevel,
}: {
	onRecordingComplete: (url: string, duration: number) => void
	onError: (error: string) => void
	onRecordingStart: () => void
	onAudioLevel?: (level: number) => void
}) {
	let mediaRecorderRef = useRef<MediaRecorder | null>(null)
	let audioContextRef = useRef<AudioContext | null>(null)
	let analyserRef = useRef<AnalyserNode | null>(null)
	let streamRef = useRef<MediaStream | null>(null)
	let chunksRef = useRef<Blob[]>([])
	let timerRef = useRef<number | null>(null)
	let animationRef = useRef<number | null>(null)
	let startTimeRef = useRef<number>(0)

	let [audioLevel, setAudioLevel] = useState(0)
	let [duration, setDuration] = useState(0)
	let [error, setError] = useState<string | null>(null)

	let cleanup = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop())
			streamRef.current = null
		}

		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== "inactive"
		) {
			mediaRecorderRef.current.stop()
		}
		mediaRecorderRef.current = null

		if (audioContextRef.current && audioContextRef.current.state !== "closed") {
			audioContextRef.current.close()
		}
		audioContextRef.current = null
		analyserRef.current = null

		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}

		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current)
			animationRef.current = null
		}

		setAudioLevel(0)
		setDuration(0)
	}, [])

	let startRecording = useCallback(async () => {
		try {
			setError(null)
			onRecordingStart()

			let stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream

			let mediaRecorder = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			})
			mediaRecorderRef.current = mediaRecorder

			let audioContext = createAudioContext()
			audioContextRef.current = audioContext
			let analyser = audioContext.createAnalyser()
			analyser.fftSize = 256
			analyserRef.current = analyser

			let microphone = audioContext.createMediaStreamSource(stream)
			microphone.connect(analyser)

			chunksRef.current = []
			startTimeRef.current = Date.now()

			mediaRecorder.ondataavailable = event => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data)
				}
			}

			mediaRecorder.onstop = () => {
				let blob = new Blob(chunksRef.current, {
					type: "audio/webm;codecs=opus",
				})
				let url = URL.createObjectURL(blob)
				let finalDuration = Date.now() - startTimeRef.current
				onRecordingComplete(url, finalDuration)
				cleanup()
			}

			setupAudioAnalyzer(analyser, setAudioLevel, animationRef, onAudioLevel)

			timerRef.current = window.setInterval(() => {
				let elapsed = Date.now() - startTimeRef.current
				setDuration(elapsed)

				if (elapsed >= MAX_DURATION) {
					if (
						mediaRecorderRef.current &&
						mediaRecorderRef.current.state !== "inactive"
					) {
						mediaRecorderRef.current.stop()
					}
				}
			}, 100)

			mediaRecorder.start(100)
		} catch (err) {
			let errorMessage =
				err instanceof Error ? err.message : "Failed to start recording"
			setError(errorMessage)
			onError(errorMessage)
			cleanup()
		}
	}, [cleanup, onRecordingComplete, onError, onRecordingStart, onAudioLevel])

	let stopRecording = useCallback(() => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop()
		}
	}, [])

	return {
		startRecording,
		stopRecording,
		cleanup,
		audioLevel,
		duration,
		recordingError: error,
	}
}

function useVoicePlayback({
	audioRef,
	onAudioLevel,
}: {
	audioRef: React.RefObject<HTMLAudioElement | null>
	onAudioLevel?: (level: number) => void
}) {
	let playbackAnalyserRef = useRef<AnalyserNode | null>(null)
	let playbackAnimationRef = useRef<number | null>(null)

	let [isPlaying, setIsPlaying] = useState(false)

	let setupPlaybackAnalyser = useCallback(() => {
		if (!audioRef.current) return

		// Clean up existing analyzer if any
		if (playbackAnalyserRef.current) {
			playbackAnalyserRef.current.disconnect()
			playbackAnalyserRef.current = null
		}
		if (playbackAnimationRef.current) {
			cancelAnimationFrame(playbackAnimationRef.current)
			playbackAnimationRef.current = null
		}

		// Create a simulated analyzer based on audio playback
		let lastUpdate = 0
		let simulateAudioLevels = (timestamp: number) => {
			if (!audioRef.current) {
				return
			}

			if (audioRef.current.paused) {
				onAudioLevel?.(0)
				return
			}

			if (audioRef.current.ended) {
				onAudioLevel?.(0)
				return
			}

			// Throttle updates to ~60fps to avoid overwhelming React
			if (timestamp - lastUpdate > 16) {
				// Simulate audio levels based on playback position
				// This creates a realistic-looking audio level animation
				let time = audioRef.current.currentTime
				let baseLevel = 30 + Math.sin(time * 2) * 20
				let variation = Math.random() * 30
				let level = Math.min(100, Math.max(0, baseLevel + variation))

				onAudioLevel?.(level)
				lastUpdate = timestamp
			}

			playbackAnimationRef.current = requestAnimationFrame(simulateAudioLevels)
		}

		playbackAnimationRef.current = requestAnimationFrame(simulateAudioLevels)
	}, [audioRef, onAudioLevel])

	let handlePlayPause = useCallback(async () => {
		if (!audioRef.current) return

		if (isPlaying) {
			audioRef.current.pause()
		} else {
			await audioRef.current.play()
		}
	}, [audioRef, isPlaying])

	return {
		isPlaying,
		setIsPlaying,
		handlePlayPause,
		setupPlaybackAnalyser,
	}
}

function setupAudioAnalyzer(
	analyser: AnalyserNode,
	setLevel: (level: number) => void,
	animationRef: React.RefObject<number | null>,
	onAudioLevel?: (level: number) => void,
) {
	let bufferLength = analyser.frequencyBinCount
	let dataArray = new Uint8Array(bufferLength)

	let animate = () => {
		animationRef.current = requestAnimationFrame(animate)
		analyser.getByteFrequencyData(dataArray)

		let sum = 0
		for (let i = 0; i < bufferLength; i++) {
			sum += dataArray[i]
		}
		let average = sum / bufferLength
		let normalizedLevel = Math.min(100, (average / 255) * 300)
		setLevel(normalizedLevel)
		if (onAudioLevel) {
			onAudioLevel(normalizedLevel)
		}
	}

	animate()
}

function createAudioContext(): AudioContext {
	let AudioContextClass =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext: typeof AudioContext })
			.webkitAudioContext
	return new AudioContextClass()
}

function formatTime(milliseconds: number) {
	let totalSeconds = Math.floor(milliseconds / 1000)
	let minutes = Math.floor(totalSeconds / 60)
	let seconds = totalSeconds % 60
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
