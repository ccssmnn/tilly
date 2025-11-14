import { useState } from "react"
import { type InferUITool } from "ai"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { ToolMessageWrapper } from "#shared/ui/tool-message-wrapper"
import { People } from "react-bootstrap-icons"
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
	let [dialogOpen, setDialogOpen] = useState(false)
	let navigate = useNavigate()
	let { setPeopleSearchQuery } = useAppStore()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={People}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<>
			<ToolMessageWrapper
				icon={People}
				onClick={() => setDialogOpen(true)}
				dialogOpen={dialogOpen}
			>
				<span className="cursor-pointer">
					{result.searchQuery ? (
						<T
							k="tool.people.found.withQuery"
							params={{ count: result.count, query: result.searchQuery }}
						/>
					) : (
						<T k="tool.people.found.count" params={{ count: result.count }} />
					)}
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.people.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.people.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
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
										setDialogOpen(false)
										navigate({ to: "/people" })
									}}
								>
									<T k="tool.people.viewSearchResults" />
								</Button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

function GetPersonDetailsResult({
	result,
}: {
	result: _GetPersonDetailsTool["output"]
}) {
	let [dialogOpen, setDialogOpen] = useState(false)

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={People}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<>
			<ToolMessageWrapper
				icon={People}
				onClick={() => setDialogOpen(true)}
				dialogOpen={dialogOpen}
			>
				<span className="cursor-pointer">
					<T
						k="tool.person.read.message"
						params={{
							name: `"${result.name}"`,
							notesCount: result.notes.length,
							remindersCount: result.reminders.length,
						}}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.person.read.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.person.read.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
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
						<div className="flex gap-3">
							<Button asChild variant="outline" className="flex-1">
								<Link
									to="/people/$personID"
									params={{ personID: result.personId }}
								>
									<T k="tool.viewPerson" />
								</Link>
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
