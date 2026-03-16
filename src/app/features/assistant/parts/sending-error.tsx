import { Link } from "@tanstack/react-router"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Button } from "#shared/ui/button"
import { T } from "#shared/intl/setup"
import {
	isUsageLimitError,
	isRequestTooLargeError,
	isWorkerTimeoutError,
	isEmptyMessagesError,
} from "../lib/error-handling"

export { SendingError }

function SendingError({ error }: { error: Error | null }) {
	if (!error) return null

	return (
		<Alert variant="destructive">
			<AlertTitle>
				{isUsageLimitError(error) ? (
					<T k="assistant.usageLimit.title" />
				) : isRequestTooLargeError(error) ? (
					<T k="assistant.requestTooLarge.title" />
				) : isWorkerTimeoutError(error) ? (
					<T k="assistant.workerTimeout.title" />
				) : isEmptyMessagesError(error) ? (
					<T k="assistant.sendError.title" />
				) : (
					<T k="assistant.sendError.title" />
				)}
			</AlertTitle>
			<AlertDescription>
				{isUsageLimitError(error) ? (
					<div className="space-y-2">
						<T k="assistant.usageLimit.description" />
						<Button variant="outline" size="sm" className="mt-2">
							<Link to="/settings">
								<T k="assistant.usageLimit.viewSettings" />
							</Link>
						</Button>
					</div>
				) : isRequestTooLargeError(error) ? (
					<T k="assistant.requestTooLarge.description" />
				) : isWorkerTimeoutError(error) ? (
					<T k="assistant.workerTimeout.description" />
				) : isEmptyMessagesError(error) ? (
					<T k="assistant.emptyMessages.description" />
				) : (
					<span className="select-text">{error.message}</span>
				)}
			</AlertDescription>
		</Alert>
	)
}
