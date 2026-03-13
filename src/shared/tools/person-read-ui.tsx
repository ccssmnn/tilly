import { useState } from "react"
import { type InferUITool } from "ai"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { UserMultipleIcon } from "@hugeicons/core-free-icons"
import { Link, useNavigate } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import { T } from "#shared/intl/setup"
import type {
	createGetPersonDetailsTool,
	createListPeopleTool,
} from "./person-read"

type _ListPeopleTool = InferUITool<ReturnType<typeof createListPeopleTool>>
type _GetPersonDetailsTool = InferUITool<
	ReturnType<typeof createGetPersonDetailsTool>
>

export { ListPeopleResult, GetPersonDetailsResult }

function ListPeopleResult({ result }: { result: _ListPeopleTool["output"] }) {
	let [dialogOpen, setDrawerOpen] = useState(false)
	let navigate = useNavigate()
	let { setPeopleSearchQuery } = useAppStore()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={UserMultipleIcon}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<ToolMessageAccordion
			icon={UserMultipleIcon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				result.searchQuery ? (
					<T
						k="tool.people.found.withQuery"
						params={{ count: result.count, query: result.searchQuery }}
					/>
				) : (
					<T k="tool.people.found.count" params={{ count: result.count }} />
				)
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.people.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.people.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.people.dialog.results" />
						</h4>
						<p className="text-sm">
							{result.searchQuery ? (
								<T
									k="tool.people.found.withQuery"
									params={{ count: result.count, query: result.searchQuery }}
								/>
							) : (
								<T
									k="tool.people.found.count"
									params={{ count: result.count }}
								/>
							)}
						</p>
					</div>
					{result.searchQuery && (
						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => {
									setPeopleSearchQuery(result.searchQuery!)
									setDrawerOpen(false)
									navigate({ to: "/people" })
								}}
							>
								<T k="tool.people.viewSearchResults" />
							</Button>
						</div>
					)}
				</div>
			}
		/>
	)
}

function GetPersonDetailsResult({
	result,
}: {
	result: _GetPersonDetailsTool["output"]
}) {
	let [dialogOpen, setDrawerOpen] = useState(false)

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={UserMultipleIcon}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let previewNotes = result.notes.slice(0, 3)
	let previewReminders = result.reminders.slice(0, 3)

	return (
		<ToolMessageAccordion
			icon={UserMultipleIcon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				<T
					k="tool.person.read.message"
					params={{
						name: `"${result.name}"`,
						notesCount: result.notes.length,
						remindersCount: result.reminders.length,
					}}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.person.read.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.person.read.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.person.read.dialog.section" />
						</h4>
						<p className="text-sm font-medium">{result.name}</p>
						{result.summary && (
							<p className="text-muted-foreground mt-1 text-sm">
								{result.summary}
							</p>
						)}
					</div>
					<div className="text-muted-foreground flex items-center gap-4 text-sm">
						{result.notes.length > 0 && (
							<span>
								<T
									k="tool.person.read.dialog.notesCount"
									params={{ count: result.notes.length }}
								/>
							</span>
						)}
						{result.reminders.length > 0 && (
							<span>
								<T
									k="tool.person.read.dialog.remindersCount"
									params={{ count: result.reminders.length }}
								/>
							</span>
						)}
					</div>
					<div className="space-y-2">
						<h4 className="text-sm font-medium">
							<T
								k="tool.person.read.dialog.notesCount"
								params={{ count: result.notes.length }}
							/>
						</h4>
						{previewNotes.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								<T k="tool.note.list.empty.noNotes" />
							</p>
						) : (
							<div className="divide-border divide-y rounded-md text-sm">
								{previewNotes.map(note => (
									<div key={note.id} className="space-y-1 px-3 py-2">
										{note.title && <p className="font-medium">{note.title}</p>}
										<p className="text-muted-foreground line-clamp-2">
											{note.content}
										</p>
										{note.pinned && (
											<p className="text-muted-foreground text-xs">
												<T k="tool.note.pinned" />
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
					<div className="space-y-2">
						<h4 className="text-sm font-medium">
							<T
								k="tool.person.read.dialog.remindersCount"
								params={{ count: result.reminders.length }}
							/>
						</h4>
						{previewReminders.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								<T k="tool.reminder.list.empty.noActive" />
							</p>
						) : (
							<div className="space-y-2 text-sm">
								{previewReminders.map(reminder => (
									<div
										key={reminder.id}
										className="border-border rounded-md border p-2"
									>
										<p className="truncate font-medium">{reminder.text}</p>
									</div>
								))}
							</div>
						)}
					</div>
					<div className="flex gap-3">
						<Button variant="outline" className="flex-1">
							<Link
								to="/people/$personID"
								params={{ personID: result.personId }}
							>
								<T k="tool.viewPerson" />
							</Link>
						</Button>
					</div>
				</div>
			}
		/>
	)
}
