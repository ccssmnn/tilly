import { useState } from "react"
import { type InferUITool } from "ai"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	RefreshIcon,
	PauseIcon,
	UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { T, useIntl } from "#shared/intl/setup"
import {
	createDeletePersonTool,
	updatePerson,
} from "#shared/tools/person-update"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"

export { PersonDeleteResult }

type DeletePersonToolUI = InferUITool<ReturnType<typeof createDeletePersonTool>>

function PersonDeleteResult({
	result,
	addMessage,
}: {
	result: DeletePersonToolUI["output"]
	addMessage: (message: TillyUIMessage) => void
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={UserMultipleIcon}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDrawerOpen(false)
		try {
			await updatePerson(me, {
				personId: result.current.personId,
				deletedAt: undefined,
			})
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: t("tool.person.deleted.undo.success", {
							name: result.current.name,
						}),
					},
				],
			})
		} catch (error) {
			addMessage({
				id: `undo-error-${nanoid()}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: t("tool.error.failedToUndo", {
							error:
								error instanceof Error
									? error.message
									: typeof error === "string"
										? error
										: t("tool.error.unknown"),
						}),
					},
				],
			})
		} finally {
			setIsUndoing(false)
		}
	}

	if (isUndone) {
		return (
			<ToolMessageWrapper icon={UserMultipleIcon}>
				<span className="text-gray-500 line-through">
					<T
						k="tool.person.deleted.undone"
						params={{ name: result.current.name }}
					/>
				</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<ToolMessageAccordion
			icon={UserMultipleIcon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				<T
					k="tool.person.deleted.message"
					params={{ name: `"${result.current.name}"` }}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.person.deleted.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.person.deleted.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.person.deleted.dialog.section" />
						</h4>
						<p className="text-sm font-medium">{result.current.name}</p>
						{result.current.summary && (
							<p className="text-muted-foreground mt-1 text-sm">
								{result.current.summary}
							</p>
						)}
					</div>
					<div className="flex gap-3">
						<Button
							variant="secondary"
							className="flex-1"
							onClick={handleUndo}
							disabled={isUndoing}
						>
							{isUndoing ? (
								<HugeiconsIcon
									icon={PauseIcon}
									className="mr-2 h-3 w-3 animate-spin"
								/>
							) : (
								<HugeiconsIcon icon={RefreshIcon} className="mr-2 h-3 w-3" />
							)}
							<T k="tool.restore" />
						</Button>
					</div>
				</div>
			}
		/>
	)
}
