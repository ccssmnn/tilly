import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { ToolMessageWrapper } from "#shared/ui/tool-message-wrapper"
import { Bell } from "react-bootstrap-icons"
import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { createListRemindersTool } from "#shared/tools/reminder-read"
import type { InferToolOutput } from "ai"

export { ListRemindersResult }

function ListRemindersResult({
	result,
}: {
	result: InferToolOutput<ReturnType<typeof createListRemindersTool>>
}) {
	let [dialogOpen, setDialogOpen] = useState(false)
	let navigate = useNavigate()
	let { setRemindersSearchQuery } = useAppStore()
	let t = useIntl()
	let locale = useLocale()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={Bell}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let { reminders, totalCount, filteredCount, searchQuery, dueOnly } = result

	let handleViewReminders = () => {
		if (searchQuery) {
			setRemindersSearchQuery(searchQuery)
		}
		setDialogOpen(false)
		navigate({ to: "/reminders" })
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
						k="tool.reminder.list.message.count"
						params={{ count: filteredCount || totalCount }}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.reminder.list.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.reminder.list.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
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
						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setDialogOpen(false)}
							>
								<T k="common.cancel" />
							</Button>
							<Button className="flex-1" onClick={handleViewReminders}>
								<T k="tool.viewReminders" />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
