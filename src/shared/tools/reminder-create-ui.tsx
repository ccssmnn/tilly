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
	Calendar01Icon,
	CheckmarkCircle01Icon,
	CircleIcon,
} from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "#app/hooks/use-chat-history"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { createAddReminderTool } from "#shared/tools/reminder-create"
import { updateReminder } from "#shared/tools/reminder-update"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"

export { AddReminderResult, ReminderDetails }

type _AddReminderTool = InferUITool<ReturnType<typeof createAddReminderTool>>

function AddReminderResult({ result }: { result: _AddReminderTool["output"] }) {
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
				{ deletedAt: new Date() },
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
					{
						type: "text",
						text: t("tool.reminder.created.undo.success", {
							text: result.text,
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
			<ToolMessageWrapper icon={Notification01Icon}>
				<span className="text-gray-500 line-through">
					<T
						k="tool.reminder.created.undone"
						params={{
							text: `"${result.text.length > 50 ? result.text.substring(0, 50) + "..." : result.text}"`,
						}}
					/>
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
				<T
					k="tool.reminder.created.message"
					params={{
						text: `"${result.text.length > 50 ? result.text.substring(0, 50) + "..." : result.text}"`,
					}}
				/>
			}
			content={
				<div className="space-y-4">
					<div>
						<h3 className="text-base font-semibold">
							<T k="tool.reminder.created.dialog.title" />
						</h3>
						<p className="text-muted-foreground text-sm">
							<T k="tool.reminder.created.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.reminder.created.dialog.section" />
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
							variant="destructive"
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
							<T k="tool.undo" />
						</Button>
					</div>
				</div>
			}
		/>
	)
}

function ReminderDetails({
	text,
	dueAt,
	repeat,
	done,
}: {
	text: string
	dueAt?: string
	repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	done?: boolean
}) {
	let t = useIntl()
	let locale = useLocale()
	return (
		<>
			<p className="text-sm">{text}</p>
			<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
				{repeat ? (
					<HugeiconsIcon icon={RefreshIcon} className="h-4 w-4" />
				) : (
					<HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
				)}
				<span className="whitespace-nowrap">
					{dueAt
						? new Date(dueAt).toLocaleDateString(locale)
						: t("tool.reminder.noDate")}
				</span>
				{repeat && (
					<span className="whitespace-nowrap">
						<T
							k="tool.reminder.repeats"
							params={{ interval: repeat.interval, unit: repeat.unit }}
						/>
					</span>
				)}
				{done !== undefined && (
					<span className="flex items-center gap-1 whitespace-nowrap">
						{done ? (
							<>
								<HugeiconsIcon
									icon={CheckmarkCircle01Icon}
									className="h-3 w-3 text-green-600"
								/>{" "}
								<T k="tool.reminder.done" />
							</>
						) : (
							<>
								<HugeiconsIcon icon={CircleIcon} className="h-3 w-3" />{" "}
								<T k="tool.reminder.notDone" />
							</>
						)}
					</span>
				)}
			</div>
		</>
	)
}
