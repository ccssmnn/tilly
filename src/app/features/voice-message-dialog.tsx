import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "#shared/ui/button"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import { Mic, StopCircle, Play, PauseFill, Send } from "react-bootstrap-icons"
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
	let [state, setState] = useState<RecordingState>("idle")
	let [audioUrl, setAudioUrl] = useState<string | null>(null)
	let [error, setError] = useState<string | null>(null)

	let {
		startRecording,
		stopRecording,
		cleanup,
		audioLevel,
		duration,
		recordingError,
	} = useVoiceRecorder({
		onRecordingComplete: url => {
			setAudioUrl(url)
			setState("stopped")
		},
		onError: err => setError(err),
	})

	let {
		isPlaying,
		setIsPlaying,
		playbackLevel,
		handlePlayPause,
		setupPlaybackAnalyser,
	} = useVoicePlayback({ audioRef })

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
		let handlePlay = () => setupPlaybackAnalyser()
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

					<div>
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
										className="bg-primary h-full"
										style={{ width: `${Math.min(100, audioLevel)}%` }}
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
										{formatTime(duration)}
									</div>
								</div>
								{isPlaying && (
									<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
										<div
											className="bg-primary h-full transition-all duration-100"
											style={{ width: `${Math.min(100, playbackLevel)}%` }}
										/>
									</div>
								)}
							</div>
						)}

						{state === "idle" && <div className="py-4" />}
					</div>

					<div className="flex justify-end gap-2">
						{state === "idle" && (
							<>
								<Button onClick={() => onOpenChange(false)} variant="outline">
									<T k="common.cancel" />
								</Button>
								<Button onClick={startRecording}>
									<Mic className="size-4" />
									<T k="assistant.voiceRecording.start" />
								</Button>
							</>
						)}

						{state === "recording" && (
							<Button onClick={stopRecording} variant="destructive">
								<StopCircle className="size-4" />
								<T k="assistant.voiceRecording.stop" />
							</Button>
						)}

						{state === "stopped" && (
							<>
								<Button onClick={handlePlayPause} variant="outline" size="icon">
									{isPlaying ? (
										<PauseFill className="size-5" />
									) : (
										<Play className="size-5" />
									)}
								</Button>
								<Button onClick={reset} variant="outline">
									Reset
								</Button>
								<Button onClick={handleSendRecording}>
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
}: {
	onRecordingComplete: (url: string) => void
	onError: (error: string) => void
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
				onRecordingComplete(url)
				cleanup()
			}

			setupAudioAnalyzer(analyser, setAudioLevel, animationRef)

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
	}, [cleanup, onRecordingComplete, onError])

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
}: {
	audioRef: React.RefObject<HTMLAudioElement | null>
}) {
	let playbackAnalyserRef = useRef<AnalyserNode | null>(null)
	let playbackAnimationRef = useRef<number | null>(null)

	let [isPlaying, setIsPlaying] = useState(false)
	let [playbackLevel, setPlaybackLevel] = useState(0)

	let setupPlaybackAnalyser = useCallback(() => {
		if (!audioRef.current || playbackAnalyserRef.current) return

		let audioContext = createAudioContext()
		let analyser = audioContext.createAnalyser()
		analyser.fftSize = 256
		playbackAnalyserRef.current = analyser

		let source = audioContext.createMediaElementSource(audioRef.current)
		source.connect(analyser)
		analyser.connect(audioContext.destination)

		setupAudioAnalyzer(analyser, setPlaybackLevel, playbackAnimationRef)
	}, [audioRef])

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
		playbackLevel,
		handlePlayPause,
		setupPlaybackAnalyser,
	}
}

function setupAudioAnalyzer(
	analyser: AnalyserNode,
	setLevel: (level: number) => void,
	animationRef: React.RefObject<number | null>,
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
