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
import { ArrowCounterclockwise, Pause, Journal } from "react-bootstrap-icons"
import { Link } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { addNoteTool } from "#shared/tools/note-create"
import { updateNote } from "#shared/tools/note-update"
import { cn } from "#app/lib/utils"

type _AddNoteTool = InferUITool<typeof addNoteTool>

export { AddNoteResult }

function AddNoteResult({ result }: { result: _AddNoteTool["output"] }) {
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDialogOpen] = useState(false)
	let { addChatMessage } = useAppStore()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		setIsUndoing(true)
		setDialogOpen(false)
		try {
			updateNote(result.personId, result.noteId, { deletedAt: new Date() })
			setIsUndone(true)
			addChatMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [{ type: "text", text: t("tool.note.created.undo.success") }],
			})
		} catch (error) {
			addChatMessage({
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
					<T k="tool.note.created.undone" />
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
					<T
						k="tool.note.created.message"
						params={{
							content: `"${result.content.substring(0, 50)}${result.content.length > 50 ? "..." : ""}"`,
						}}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.note.created.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.note.created.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<div>
							<h4 className="mb-2 text-sm font-medium">
								<T k="tool.note.created.dialog.section" />
							</h4>
							<p className="text-sm whitespace-pre-line">{result.content}</p>
							{result.pinned && (
								<p className="text-muted-foreground mt-1 text-sm">
									<T k="tool.note.pinned" />
								</p>
							)}
						</div>
						<div className="flex gap-3">
							<Button asChild variant="outline" className="flex-1">
								<Link
									to="/people/$personID"
									params={{ personID: result.personId }}
									search={{ tab: "notes" }}
									hash={`note-${result.noteId}`}
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
			<Journal className="h-4 w-4" />
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
