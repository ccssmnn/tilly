export {
	isUsageLimitError,
	isRequestTooLargeError,
	isEmptyMessagesError,
	isWorkerTimeoutError,
}

type ErrorPayload = {
	code?: string
	error?: string
}

function isUsageLimitError(error: unknown): boolean {
	return extractErrorPayload(error)?.code === "usage-limit-exceeded"
}

function isRequestTooLargeError(error: unknown): boolean {
	return extractErrorPayload(error)?.code === "request-too-large"
}

function isEmptyMessagesError(error: unknown): boolean {
	return extractErrorPayload(error)?.code === "empty-messages"
}

function isWorkerTimeoutError(error: unknown): boolean {
	return extractErrorPayload(error)?.code === "worker-timeout"
}

function extractErrorPayload(value: unknown): ErrorPayload | null {
	if (isRecord(value) && "code" in value) {
		return value as ErrorPayload
	}

	let message = extractErrorMessage(value)
	if (!message) return null

	try {
		let parsed: unknown = JSON.parse(message)
		if (isRecord(parsed)) return parsed as ErrorPayload
		return null
	} catch {
		return null
	}
}

function extractErrorMessage(error: unknown): string | null {
	if (typeof error === "string") return error
	if (error instanceof Error) return error.message
	return null
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === "object" && value !== null
}
