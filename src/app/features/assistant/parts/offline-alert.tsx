import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { WifiOff } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"

export { OfflineAlert }

function OfflineAlert() {
	return (
		<Alert>
			<WifiOff />
			<AlertTitle>
				<T k="assistant.chatUnavailable.title" />
			</AlertTitle>
			<AlertDescription>
				<T k="assistant.chatUnavailable.description" />
			</AlertDescription>
		</Alert>
	)
}
