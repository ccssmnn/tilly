import type { co } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Button } from "#shared/ui/button"
import { InfoCircleFill } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"

export { ClearChatHint }

function ClearChatHint({
	assistant,
}: {
	assistant: co.loaded<typeof Assistant> | undefined
}) {
	if (!assistant || assistant.clearChatHintDismissedAt) return null

	return (
		<Alert>
			<InfoCircleFill />
			<AlertTitle>
				<T k="assistant.clearChatHint.title" />
			</AlertTitle>
			<AlertDescription>
				<T k="assistant.clearChatHint.description" />
				<div className="flex justify-end">
					<Button
						variant="secondary"
						onClick={() => {
							assistant.$jazz.set("clearChatHintDismissedAt", new Date())
						}}
						className="mt-2"
					>
						<T k="assistant.clearChatHint.dismiss" />
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	)
}
