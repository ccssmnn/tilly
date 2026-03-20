import { TaggedError } from "better-result"

export class WorkerTimeout extends TaggedError("WorkerTimeout")<{
	message: string
}>() {}

export class UsageLimitExceeded extends TaggedError("UsageLimitExceeded")<{
	message: string
}>() {}

export class InputTooLarge extends TaggedError("InputTooLarge")<{
	message: string
	overflow: number
}>() {}

export class EmptyMessages extends TaggedError("EmptyMessages")<{
	message: string
}>() {}

export class NotFound extends TaggedError("NotFound")<{
	message: string
}>() {}

export class SendFailed extends TaggedError("SendFailed")<{
	message: string
	shouldRemove: boolean
}>() {}

export class SyncFailed extends TaggedError("SyncFailed")<{
	message: string
}>() {}

export class ServerError extends TaggedError("ServerError")<{
	message: string
}>() {}

type DomainError =
	| WorkerTimeout
	| UsageLimitExceeded
	| InputTooLarge
	| EmptyMessages
	| NotFound
	| SendFailed
	| SyncFailed
	| ServerError

type StatusCode = 400 | 413 | 429 | 500 | 504

export function errorToStatus(error: DomainError): StatusCode {
	switch (error._tag) {
		case "WorkerTimeout":
			return 504
		case "UsageLimitExceeded":
			return 429
		case "InputTooLarge":
			return 413
		case "EmptyMessages":
			return 400
		case "NotFound":
			return 400
		case "SendFailed":
			return 500
		case "SyncFailed":
			return 500
		case "ServerError":
			return 500
	}
}
