interface SpeechRecognition extends EventTarget {
	continuous: boolean
	interimResults: boolean
	lang: string
	start(): void
	stop(): void
	onstart: ((this: SpeechRecognition, ev: Event) => void) | null
	onend: ((this: SpeechRecognition, ev: Event) => void) | null
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
		| null
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
		| null
}

interface SpeechRecognitionEvent extends Event {
	readonly resultIndex: number
	readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
	readonly length: number
	item(index: number): SpeechRecognitionResult
	[index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
	readonly isFinal: boolean
	readonly length: number
	item(index: number): SpeechRecognitionAlternative
	[index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
	readonly transcript: string
	readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string
	readonly message: string
}

declare var webkitSpeechRecognition: {
	prototype: SpeechRecognition
	new (): SpeechRecognition
}

interface Window {
	webkitSpeechRecognition: typeof webkitSpeechRecognition
}
