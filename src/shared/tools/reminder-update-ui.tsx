import { type ReactNode, useState } from "react"
import { type InferUITool } from "ai"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import { Alert, AlertDescription } from "#shared/ui/alert"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { ArrowCounterclockwise, Pause, Bell } from "react-bootstrap-icons"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "#app/hooks/use-chat-history"
import { T, useIntl } from "#shared/intl/setup"
import {
	createUpdateReminderTool,
	createRemoveReminderTool,
	updateReminder,
} from "#shared/tools/reminder-update"
import { ReminderDetails } from "./reminder-create-ui"
import { cn } from "#app/lib/utils"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"

export { UpdateReminderResult, RemoveReminderResult }

type _UpdateReminderTool = InferUITool<
	ReturnType<typeof createUpdateReminderTool>
>
type _RemoveReminderTool = InferUITool<
	ReturnType<typeof createRemoveReminderTool>
>

function UpdateReminderResult({
	result,
}: {
	result: _UpdateReminderTool["output"]
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDialogOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDialogOpen(false)
		try {
			if (result.previous) {
				await updateReminder(
					{
						text: result.previous.text,
						dueAtDate: result.previous.dueAtDate,
						repeat: result.previous.repeat,
						done: result.previous.done,
					},
					{
						worker: me,
						personId: result.personId,
						reminderId: result.reminderId,
					},
				)
			}
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{ type: "text", text: t("tool.reminder.updated.undo.success") },
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
			<ToolMessageWrapper>
				<span className="text-gray-500 line-through">
					<T k="tool.reminder.updated.undone" />
				</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<>
			<ToolMessageWrapper
				onClick={() => setDialogOpen(true)}
				dialogOpen={dialogOpen}
			>
				<span className="cursor-pointer">
					<T k="tool.reminder.updated.message" />
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.reminder.updated.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.reminder.updated.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<div>
							<h4 className="mb-2 text-sm font-medium">
								<T k="tool.reminder.updated.dialog.current" />
							</h4>
							<ReminderDetails
								text={result.text}
								dueAt={result.dueAtDate}
								repeat={result.repeat}
								done={result.done}
							/>
						</div>
						{result.previous && (
							<div className="text-muted-foreground">
								<h4 className="mb-2 text-sm font-medium">
									<T k="tool.reminder.updated.dialog.previous" />
								</h4>
								<ReminderDetails
									text={result.previous.text}
									dueAt={result.previous.dueAtDate}
									repeat={result.previous.repeat}
									done={result.previous.done}
								/>
							</div>
						)}
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

function RemoveReminderResult({
	result,
}: {
	result: _RemoveReminderTool["output"]
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDialogOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDialogOpen(false)
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

	if (isUndone) {
		return (
			<ToolMessageWrapper>
				<span className="text-gray-500 line-through">
					<T k="tool.reminder.deleted.undone" />
				</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<>
			<ToolMessageWrapper
				onClick={() => setDialogOpen(true)}
				dialogOpen={dialogOpen}
			>
				<span className="cursor-pointer">
					<T k="tool.reminder.deleted.message" />
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.reminder.deleted.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.reminder.deleted.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
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
								variant="secondary"
								className="flex-1"
								onClick={handleUndo}
								disabled={isUndoing}
							>
								{isUndoing ? (
									<Pause className="mr-2 h-3 w-3 animate-spin" />
								) : (
									<ArrowCounterclockwise className="mr-2 h-3 w-3" />
								)}
								<T k="tool.restore" />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

function ToolMessageWrapper({
	children,
	onClick,
	dialogOpen,
}: {
	children: ReactNode
	onClick?: () => void
	dialogOpen?: boolean
}) {
	return (
		<Alert
			className={cn(
				onClick && "hover:bg-accent cursor-pointer",
				dialogOpen && "bg-accent",
			)}
		>
			<Bell className="h-4 w-4" />
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
