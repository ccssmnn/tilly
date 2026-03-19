import { Link } from "@tanstack/react-router"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Button } from "#shared/ui/button"
import { T } from "#shared/intl/setup"
import type { SendingErrorKind } from "../lib/error-handling"

export { SendingError }

function SendingError({
	error,
	errorKind,
}: {
	error: Error | null
	errorKind: SendingErrorKind
}) {
	if (!error) return null

	return (
		<Alert variant="destructive">
			<AlertTitle>
				{errorKind === "usage-limit" ? (
					<T k="assistant.usageLimit.title" />
				) : errorKind === "request-too-large" ? (
					<T k="assistant.requestTooLarge.title" />
				) : errorKind === "worker-timeout" ? (
					<T k="assistant.workerTimeout.title" />
				) : errorKind === "empty-messages" ? (
					<T k="assistant.sendError.title" />
				) : (
					<T k="assistant.sendError.title" />
				)}
			</AlertTitle>
			<AlertDescription>
				{errorKind === "usage-limit" ? (
					<div className="space-y-2">
						<T k="assistant.usageLimit.description" />
						<Button variant="outline" size="sm" className="mt-2">
							<Link to="/settings">
								<T k="assistant.usageLimit.viewSettings" />
							</Link>
						</Button>
					</div>
				) : errorKind === "request-too-large" ? (
					<T k="assistant.requestTooLarge.description" />
				) : errorKind === "worker-timeout" ? (
					<T k="assistant.workerTimeout.description" />
				) : errorKind === "empty-messages" ? (
					<T k="assistant.emptyMessages.description" />
				) : (
					<span className="select-text">{error.message}</span>
				)}
			</AlertDescription>
		</Alert>
	)
}
