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
import {
	ArrowCounterclockwise,
	Pause,
	FileEarmarkText,
} from "react-bootstrap-icons"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "#app/hooks/use-chat-history"
import { T, useIntl } from "#shared/intl/setup"
import {
	editNoteTool,
	deleteNoteTool,
	updateNote,
} from "#shared/tools/note-update"
import { cn } from "#app/lib/utils"

type _EditNoteTool = InferUITool<typeof editNoteTool>
type _DeleteNoteTool = InferUITool<typeof deleteNoteTool>

export { EditNoteResult, DeleteNoteResult }

function EditNoteResult({ result }: { result: _EditNoteTool["output"] }) {
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
		setIsUndoing(true)
		setDialogOpen(false)
		try {
			if (result.previous) {
				await updateNote(result.personId, result.noteId, {
					title: result.previous.title,
					content: result.previous.content,
					pinned: result.previous.pinned,
					createdAt: result.previous.createdAt
						? new Date(result.previous.createdAt)
						: undefined,
					deletedAt: result.previous.deletedAt
						? new Date(result.previous.deletedAt)
						: undefined,
					permanentlyDeletedAt: undefined,
				})
			}
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [{ type: "text", text: t("tool.note.updated.undo.success") }],
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
					<T k="tool.note.updated.undone" />
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
						k="tool.note.updated.message"
						params={{
							content: `"${result.content?.substring(0, 50) || ""}${(result.content?.length || 0) > 50 ? "..." : ""}"`,
						}}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.note.updated.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.note.updated.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						{result.content && (
							<div>
								<h4 className="mb-2 text-sm font-medium">
									<T k="tool.note.updated.dialog.current" />
								</h4>
								<p className="text-sm whitespace-pre-line">{result.content}</p>
								{result.pinned && (
									<p className="text-muted-foreground mt-1 text-sm">
										<T k="tool.note.pinned" />
									</p>
								)}
							</div>
						)}
						{result.previous && (
							<div className="text-muted-foreground">
								<h4 className="mb-2 text-sm font-medium">
									<T k="tool.note.updated.dialog.previous" />
								</h4>
								<p className="text-sm whitespace-pre-line">
									{result.previous.content}
								</p>
								{result.previous.pinned && (
									<p className="mt-1 text-sm">
										<T k="tool.note.pinned" />
									</p>
								)}
							</div>
						)}
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

function DeleteNoteResult({ result }: { result: _DeleteNoteTool["output"] }) {
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
		setIsUndoing(true)
		setDialogOpen(false)
		try {
			await updateNote(result.personId, result.noteId, { deletedAt: undefined })
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [{ type: "text", text: t("tool.note.deleted.undo.success") }],
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
					<T k="tool.note.deleted.undone" />
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
						k="tool.note.deleted.message"
						params={{
							content: `"${result.content?.substring(0, 50) || ""}${(result.content?.length || 0) > 50 ? "..." : ""}"`,
						}}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.note.deleted.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.note.deleted.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<div>
							<h4 className="mb-2 text-sm font-medium">
								<T k="tool.note.deleted.dialog.section" />
							</h4>
							<p className="text-sm whitespace-pre-line">{result.content}</p>
							{result.pinned && (
								<p className="text-muted-foreground mt-1 text-sm">
									<T k="tool.note.pinned" />
								</p>
							)}
						</div>
						<div className="flex gap-3">
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
			<FileEarmarkText className="h-4 w-4" />
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
