import { useState } from "react"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { HugeiconsIcon } from "@hugeicons/react"
import { RefreshIcon, PauseIcon, File02Icon } from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"
import { T, useIntl } from "#shared/intl/setup"
import { createAddNoteTool } from "#shared/tools/note-create"
import { updateNote } from "#shared/tools/note-update"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import type { InferToolOutput } from "ai"
import type { TillyUIMessage } from "#shared/tools/tools"

export { NoteCreateResult }

function NoteCreateResult({
	result,
	addMessage,
}: {
	result: InferToolOutput<ReturnType<typeof createAddNoteTool>>
	addMessage: (message: TillyUIMessage) => void
}) {
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let t = useIntl()
	let me = useAccount(UserAccount)

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={File02Icon}>
				<span className="text-red-600">❌ {result.error}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDrawerOpen(false)
		try {
			updateNote(me, {
				personId: result.current.personId,
				noteId: result.current.noteId,
				deletedAt: new Date(),
			})
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [{ type: "text", text: t("tool.note.created.undo.success") }],
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
			<ToolMessageWrapper icon={File02Icon}>
				<span className="text-gray-500 line-through">
					<T k="tool.note.created.undone" />
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
					k="tool.note.created.message"
					params={{
						content: `"${result.current.content.substring(0, 50)}${result.current.content.length > 50 ? "..." : ""}"`,
					}}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.note.created.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.note.created.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.note.created.dialog.section" />
						</h4>
						<p className="text-sm whitespace-pre-line">
							{result.current.content}
						</p>
						{result.current.pinned && (
							<p className="text-muted-foreground mt-1 text-sm">
								<T k="tool.note.pinned" />
							</p>
						)}
					</div>
					<div className="flex gap-3">
						<Button variant="outline" className="flex-1">
							<Link
								to="/people/$personID"
								params={{ personID: result.current.personId }}
								search={{ tab: "notes" }}
								hash={`note-${result.current.noteId}`}
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
