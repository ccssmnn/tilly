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
import { T, useIntl, useLocale } from "#shared/intl/setup"
import {
	createUpdateReminderTool,
	updateReminder,
} from "#shared/tools/reminder-update"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"
import {
	Calendar01Icon,
	CheckmarkCircle01Icon,
	CircleIcon,
} from "@hugeicons/core-free-icons"

export { ReminderUpdateResult }

type UpdateReminderToolUI = InferUITool<
	ReturnType<typeof createUpdateReminderTool>
>

function ReminderUpdateResult({
	result,
	addMessage,
}: {
	result: UpdateReminderToolUI["output"]
	addMessage: (message: TillyUIMessage) => void
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let t = useIntl()
	let locale = useLocale()

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
			await updateReminder(me, {
				personId: result.current.personId,
				reminderId: result.current.reminderId,
				text: result.previous.text,
				dueAtDate: result.previous.dueAtDate,
				repeat: result.previous.repeat,
				done: result.previous.done,
			})
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

	let textPreview = `"${result.current.text.length > 50 ? result.current.text.substring(0, 50) + "..." : result.current.text}"`

	if (isUndone) {
		return (
			<ToolMessageWrapper icon={Notification01Icon}>
				<span className="text-gray-500 line-through">
					<T k="tool.reminder.updated.undone" params={{ text: textPreview }} />
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
				<T k="tool.reminder.updated.message" params={{ text: textPreview }} />
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.reminder.updated.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.reminder.updated.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.reminder.updated.dialog.current" />
						</h4>
						{ReminderDetails(t, locale, {
							text: result.current.text,
							dueAt: result.current.dueAtDate,
							repeat: result.current.repeat,
							done: result.current.done,
						})}
					</div>
					<div className="text-muted-foreground">
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.reminder.updated.dialog.previous" />
						</h4>
						{ReminderDetails(t, locale, {
							text: result.previous.text,
							dueAt: result.previous.dueAtDate,
							repeat: result.previous.repeat,
							done: result.previous.done,
						})}
					</div>
					<div className="flex gap-3">
						<Button variant="outline" className="flex-1">
							<Link
								to="/people/$personID"
								params={{ personID: result.current.personId }}
								search={{ tab: "reminders" }}
								hash={`reminder-${result.current.reminderId}`}
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

/* eslint-disable react/prop-types -- called as function, not rendered as JSX */
function ReminderDetails(
	t: ReturnType<typeof useIntl>,
	locale: string,
	props: {
		text: string
		dueAt?: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
		done?: boolean
	},
) {
	return (
		<>
			<p className="text-sm">{props.text}</p>
			<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
				{props.repeat ? (
					<HugeiconsIcon icon={RefreshIcon} className="h-4 w-4" />
				) : (
					<HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
				)}
				<span className="whitespace-nowrap">
					{props.dueAt
						? new Date(props.dueAt).toLocaleDateString(locale)
						: t("tool.reminder.noDate")}
				</span>
				{props.repeat && (
					<span className="whitespace-nowrap">
						<T
							k="tool.reminder.repeats"
							params={{
								interval: props.repeat.interval,
								unit: props.repeat.unit,
							}}
						/>
					</span>
				)}
				{props.done !== undefined && (
					<span className="flex items-center gap-1 whitespace-nowrap">
						{props.done ? (
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
