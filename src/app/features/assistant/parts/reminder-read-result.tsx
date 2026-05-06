import { useState } from "react"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { Notification01Icon } from "@hugeicons/core-free-icons"
import { useNavigate } from "@tanstack/react-router"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { createListRemindersTool } from "#shared/tools/reminder-read"
import type { InferToolOutput } from "ai"

export { ReminderReadResult }

function ReminderReadResult({
	result,
}: {
	result: InferToolOutput<ReturnType<typeof createListRemindersTool>>
}) {
	let [dialogOpen, setDrawerOpen] = useState(false)
	let navigate = useNavigate()
	let t = useIntl()
	let locale = useLocale()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={Notification01Icon}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let { reminders, totalCount, filteredCount, searchQuery, dueOnly } = result

	let handleViewReminders = () => {
		setDrawerOpen(false)
		navigate({ to: "/reminders" })
	}

	return (
		<ToolMessageAccordion
			icon={Notification01Icon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				<T
					k="tool.reminder.list.message.count"
					params={{ count: filteredCount || totalCount }}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<h3 className="text-base font-semibold">
							<T k="tool.reminder.list.dialog.title" />
						</h3>
						<p className="text-muted-foreground text-sm">
							<T k="tool.reminder.list.dialog.description" />
						</p>
					</div>
					<div className="space-y-2">
						{reminders.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								{dueOnly
									? t("tool.reminder.list.empty.noDue")
									: searchQuery
										? t("tool.reminder.list.empty.noMatch")
										: t("tool.reminder.list.empty.noActive")}
							</p>
						) : (
							<div className="space-y-2 text-sm">
								{reminders.slice(0, 5).map(reminder => (
									<div
										key={reminder.id}
										className="border-border rounded-md border p-2"
									>
										<p className="truncate font-medium">{reminder.text}</p>
										<p className="text-muted-foreground text-xs">
											{reminder.person.name}
											{reminder.dueAtDate && (
												<span>
													{" "}
													•{" "}
													{new Date(reminder.dueAtDate).toLocaleDateString(
														locale,
													)}
												</span>
											)}
										</p>
									</div>
								))}
								{reminders.length > 5 && (
									<div className="pt-2 text-center">
										<p className="text-muted-foreground text-xs">
											<T
												k="tool.reminder.list.andMore"
												params={{ count: reminders.length - 5 }}
											/>
										</p>
									</div>
								)}
							</div>
						)}
					</div>
					<Button className="w-full" onClick={handleViewReminders}>
						<T k="tool.viewReminders" />
					</Button>
				</div>
			}
		/>
	)
}
