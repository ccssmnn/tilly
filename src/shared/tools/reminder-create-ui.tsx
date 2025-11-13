import { useState } from "react"
import { type InferUITool } from "ai"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import { ToolMessageWrapper } from "#shared/ui/tool-message-wrapper"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	ArrowCounterclockwise,
	Pause,
	Bell,
	Calendar,
	ArrowRepeat,
	CheckCircle,
	Circle,
} from "react-bootstrap-icons"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "#app/hooks/use-chat-history"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import {
	addReminderTool,
	addReminderExecute,
} from "#shared/tools/reminder-create"
import { updateReminder } from "#shared/tools/reminder-update"

export {
	addReminderTool,
	addReminderExecute,
	AddReminderResult,
	ReminderDetails,
}

type _AddReminderTool = InferUITool<typeof addReminderTool>

function AddReminderResult({
	result,
	userId,
}: {
	result: _AddReminderTool["output"]
	userId: string
}) {
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDialogOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={Bell}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		setIsUndoing(true)
		setDialogOpen(false)
		try {
			// Import updateReminder from update.tsx to properly delete the reminder
			await updateReminder(
				{ deletedAt: new Date() },
				{
					userId: userId,
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
			<ToolMessageWrapper icon={Bell}>
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
		<>
			<ToolMessageWrapper
				icon={Bell}
				onClick={() => setDialogOpen(true)}
				dialogOpen={dialogOpen}
			>
				<span className="cursor-pointer">
					<T
						k="tool.reminder.created.message"
						params={{
							text: `"${result.text.length > 50 ? result.text.substring(0, 50) + "..." : result.text}"`,
						}}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.reminder.created.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.reminder.created.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
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
							<Button asChild variant="outline" className="flex-1">
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
									<Pause className="mr-2 h-3 w-3 animate-spin" />
								) : (
									<ArrowCounterclockwise className="mr-2 h-3 w-3" />
								)}
								<T k="tool.undo" />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
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
					<ArrowRepeat className="h-4 w-4" />
				) : (
					<Calendar className="h-4 w-4" />
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
								<CheckCircle className="h-3 w-3 text-green-600" />{" "}
								<T k="tool.reminder.done" />
							</>
						) : (
							<>
								<Circle className="h-3 w-3" /> <T k="tool.reminder.notDone" />
							</>
						)}
					</span>
				)}
			</div>
		</>
	)
}
