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
	Notification01Icon,
} from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "../hooks/use-chat-history"
import { T, useIntl } from "#shared/intl/setup"
import {
	createRemoveReminderTool,
	updateReminder,
} from "#shared/tools/reminder-update"
import { ReminderDetails } from "../lib/reminder-details"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"

export { ReminderDeleteResult }

type RemoveReminderToolUI = InferUITool<
	ReturnType<typeof createRemoveReminderTool>
>

function ReminderDeleteResult({
	result,
}: {
	result: RemoveReminderToolUI["output"]
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={Notification01Icon}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDrawerOpen(false)
		try {
			await updateReminder(
				{ deletedAt: undefined },
				{
					worker: me,
					personId: result.personId,
					reminderId: result.reminderId,
				},
			)
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{ type: "text", text: t("tool.reminder.deleted.undo.success") },
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

	let textPreview = `"${result.text.length > 50 ? result.text.substring(0, 50) + "..." : result.text}"`

	if (isUndone) {
		return (
			<ToolMessageWrapper icon={Notification01Icon}>
				<span className="text-gray-500 line-through">
					<T k="tool.reminder.deleted.undone" params={{ text: textPreview }} />
				</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<ToolMessageAccordion
			icon={Notification01Icon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				<T k="tool.reminder.deleted.message" params={{ text: textPreview }} />
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.reminder.deleted.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.reminder.deleted.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.reminder.deleted.dialog.section" />
						</h4>
						<ReminderDetails
							text={result.text}
							dueAt={result.dueAtDate}
							repeat={result.repeat}
							done={result.done}
						/>
					</div>
					<div className="flex gap-3">
						<Button variant="outline" className="flex-1">
							<Link
								to="/people/$personID"
								params={{ personID: result.personId }}
								search={{ tab: "reminders" }}
								hash={`reminder-${result.reminderId}`}
							>
								<T k="tool.viewPerson" />
							</Link>
						</Button>
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
