import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { T } from "#shared/intl/setup"

export { GenerationError }

function GenerationError({ error }: { error?: string }) {
	if (!error) return null
	return (
		<Alert variant="destructive">
			<AlertTitle>
				<T k="assistant.backgroundError.title" />
			</AlertTitle>
			<AlertDescription>
				<span className="select-text">{error}</span>
			</AlertDescription>
		</Alert>
	)
}
