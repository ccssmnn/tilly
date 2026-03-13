import { type ReactNode, useState } from "react"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper as SharedToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { HugeiconsIcon } from "@hugeicons/react"
import { RefreshIcon, PauseIcon, File02Icon } from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "#app/hooks/use-chat-history"
import { T, useIntl } from "#shared/intl/setup"
import {
	createDeleteNoteTool,
	createEditNoteTool,
	updateNote,
} from "#shared/tools/note-update"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import type { InferToolOutput } from "ai"

export { EditNoteResult, DeleteNoteResult }

function EditNoteResult({
	result,
}: {
	result: InferToolOutput<ReturnType<typeof createEditNoteTool>>
}) {
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()
	let me = useAccount(UserAccount)

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
		setDrawerOpen(false)
		try {
			if (result.previous) {
				await updateNote(
					{
						title: result.previous.title,
						content: result.previous.content,
						pinned: result.previous.pinned,
						createdAt: result.previous.createdAt
							? new Date(result.previous.createdAt)
							: undefined,
						deletedAt: result.previous.deletedAt
							? new Date(result.previous.deletedAt)
							: undefined,
					},
					{
						personId: result.personId,
						noteId: result.noteId,
						worker: me,
					},
				)
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
		<ToolMessageAccordion
			icon={File02Icon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				<T
					k="tool.note.updated.message"
					params={{
						content: `"${result.content?.substring(0, 50) || ""}${(result.content?.length || 0) > 50 ? "..." : ""}"`,
					}}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.note.updated.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.note.updated.dialog.description" />
						</p>
					</div>
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
						<Button variant="outline" className="flex-1">
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

function DeleteNoteResult({
	result,
}: {
	result: InferToolOutput<ReturnType<typeof createDeleteNoteTool>>
}) {
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()
	let me = useAccount(UserAccount)

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
		setDrawerOpen(false)
		try {
			await updateNote(
				{ deletedAt: undefined },
				{
					personId: result.personId,
					noteId: result.noteId,
					worker: me,
				},
			)
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
		<ToolMessageAccordion
			icon={File02Icon}
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			summary={
				<T
					k="tool.note.deleted.message"
					params={{
						content: `"${result.content?.substring(0, 50) || ""}${(result.content?.length || 0) > 50 ? "..." : ""}"`,
					}}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.note.deleted.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.note.deleted.dialog.description" />
						</p>
					</div>
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
								<HugeiconsIcon
									icon={PauseIcon}
									className="mr-2 h-3 w-3 animate-spin"
								/>
							) : (
								<HugeiconsIcon icon={RefreshIcon} className="mr-2 h-3 w-3" />
							)}
							<T k="tool.restore" />
						</Button>
					</div>
				</div>
			}
		/>
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
		<SharedToolMessageWrapper
			icon={File02Icon}
			onClick={onClick}
			dialogOpen={dialogOpen}
		>
			{children}
		</SharedToolMessageWrapper>
	)
}
