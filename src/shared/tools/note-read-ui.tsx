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
import { FileEarmarkText } from "react-bootstrap-icons"
import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { listNotesTool } from "#shared/tools/note-read"

export { ListNotesResult }

type _ListNotesTool = InferUITool<typeof listNotesTool>

function ListNotesResult({ result }: { result: _ListNotesTool["output"] }) {
	let [dialogOpen, setDialogOpen] = useState(false)
	let navigate = useNavigate()
	let { setNotesSearchQuery } = useAppStore()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={FileEarmarkText}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let { notes, filteredCount, totalCount, searchQuery } = result
	let countToShow = searchQuery ? filteredCount : totalCount
	let messageKey:
		| "tool.note.list.message.none"
		| "tool.note.list.message.count"
		| "tool.note.list.message.withQuery"

	if (countToShow === 0) {
		messageKey = "tool.note.list.message.none"
	} else if (searchQuery) {
		messageKey = "tool.note.list.message.withQuery"
	} else {
		messageKey = "tool.note.list.message.count"
	}

	let previewNotes = notes.slice(0, 5)
	let messageParams = searchQuery
		? { count: countToShow, query: searchQuery }
		: { count: countToShow }

	function handleViewNotes() {
		setDialogOpen(false)
		navigate({ to: "/notes" })
	}

	function handleViewSearchResults() {
		if (searchQuery) {
			setNotesSearchQuery(searchQuery)
		}
		setDialogOpen(false)
		navigate({ to: "/notes" })
	}

	return (
		<>
			<ToolMessageWrapper
				icon={FileEarmarkText}
				onClick={() => setDialogOpen(true)}
				dialogOpen={dialogOpen}
			>
				<span className="cursor-pointer">
					<T k={messageKey} params={messageParams} />
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.note.list.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.note.list.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<div className="space-y-1">
							<h4 className="text-sm font-medium">
								<T k="tool.note.list.dialog.results" />
							</h4>
							<p className="text-muted-foreground text-sm">
								{searchQuery ? (
									<T
										k="tool.note.list.results.withQuery"
										params={{ count: filteredCount, query: searchQuery }}
									/>
								) : (
									<T
										k="tool.note.list.results.count"
										params={{ count: totalCount }}
									/>
								)}
							</p>
						</div>
						{previewNotes.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								{searchQuery
									? t("tool.note.list.empty.noMatch")
									: t("tool.note.list.empty.noNotes")}
							</p>
						) : (
							<div className="divide-border divide-y rounded-md text-sm">
								{previewNotes.map(note => (
									<div key={note.id} className="space-y-1 px-3 py-3">
										<div className="text-muted-foreground flex items-center justify-between text-xs tracking-wide uppercase">
											<span>{note.person.name}</span>
											{note.deleted && (
												<span className="text-destructive">
													<T k="tool.note.list.tag.deleted" />
												</span>
											)}
										</div>
										{note.title && (
											<p className="line-clamp-1 font-medium">{note.title}</p>
										)}
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
						{notes.length > previewNotes.length && (
							<p className="text-muted-foreground text-xs">
								<T
									k="tool.note.list.preview.more"
									params={{ count: notes.length - previewNotes.length }}
								/>
							</p>
						)}
						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setDialogOpen(false)}
							>
								<T k="common.cancel" />
							</Button>
							{searchQuery ? (
								<Button className="flex-1" onClick={handleViewSearchResults}>
									<T k="tool.note.list.viewSearchResults" />
								</Button>
							) : (
								<Button className="flex-1" onClick={handleViewNotes}>
									<T k="tool.note.list.viewNotes" />
								</Button>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
