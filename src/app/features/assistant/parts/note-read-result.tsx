import { useState } from "react"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { File02Icon } from "@hugeicons/core-free-icons"
import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { createListNotesTool } from "#shared/tools/note-read"
import type { InferToolOutput } from "ai"

export { NoteReadResult }

function NoteReadResult({
	result,
}: {
	result: InferToolOutput<ReturnType<typeof createListNotesTool>>
}) {
	let [dialogOpen, setDrawerOpen] = useState(false)
	let navigate = useNavigate()
	let { setNotesSearchQuery } = useAppStore()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={File02Icon}>
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
		setDrawerOpen(false)
		navigate({ to: "/notes" })
	}

	function handleViewSearchResults() {
		if (searchQuery) {
			setNotesSearchQuery(searchQuery)
		}
		setDrawerOpen(false)
		navigate({ to: "/notes" })
	}

	return (
		<ToolMessageAccordion
			icon={File02Icon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={<T k={messageKey} params={messageParams} />}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.note.list.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.note.list.dialog.description" />
						</p>
					</div>
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
					{searchQuery ? (
						<Button className="w-full" onClick={handleViewSearchResults}>
							<T k="tool.note.list.viewSearchResults" />
						</Button>
					) : (
						<Button className="w-full" onClick={handleViewNotes}>
							<T k="tool.note.list.viewNotes" />
						</Button>
					)}
				</div>
			}
		/>
	)
}
