import type { co } from "jazz-tools"
import { co as coHelpers, z } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"
import { Button } from "#shared/ui/button"
import { T } from "#shared/intl/setup"

export { ClearChatButton }

function ClearChatButton({
	assistant,
}: {
	assistant: co.loaded<typeof Assistant> | undefined
}) {
	return (
		<div className="mt-2 flex justify-center">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => {
					assistant?.$jazz.set(
						"stringifiedMessages",
						coHelpers.list(z.string()).create([]),
					)
				}}
				className="text-muted-foreground pointer-fine:hover:text-foreground"
			>
				<T k="assistant.clearChat" />
			</Button>
		</div>
	)
}
