import { useState } from "react"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	RefreshIcon,
	PauseIcon,
	UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"
import { createPersonTool } from "#shared/tools/person-create"
import { updatePerson } from "#shared/tools/person-update"
import type { InferUITool } from "ai"
import { T, useIntl } from "#shared/intl/setup"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"
import type { TillyUIMessage } from "#shared/tools/tools"

export { PersonCreateResult }

type CreatePersonToolUI = InferUITool<typeof createPersonTool>

function PersonCreateResult({
	result,
	addMessage,
}: {
	result: CreatePersonToolUI["output"]
	addMessage: (message: TillyUIMessage) => void
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={UserMultipleIcon}>
				❌ {typeof result.error === "string" ? result.error : result.error}
			</ToolMessageWrapper>
		)
	}

	if ("cancelled" in result) {
		return (
			<ToolMessageWrapper icon={UserMultipleIcon}>
				<span className="text-muted-foreground">🚫 {result.reason}</span>
			</ToolMessageWrapper>
		)
	}

	if (!("current" in result) || !result.current) return null

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDrawerOpen(false)
		try {
			await updatePerson(me, {
				personId: result.current.personId,
				deletedAt: new Date(),
			})
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: t("tool.person.created.undo.success", {
							name: result.current.name,
						}),
					},
				],
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
			<ToolMessageWrapper icon={UserMultipleIcon}>
				<span className="text-muted-foreground line-through">
					<T
						k="tool.person.created.undone"
						params={{ name: result.current.name }}
					/>
				</span>
			</ToolMessageWrapper>
		)
	}

	return (
		<ToolMessageAccordion
			open={dialogOpen}
			onOpenChange={setDrawerOpen}
			icon={UserMultipleIcon}
			summary={
				<T
					k="tool.person.created.message"
					params={{ name: `"${result.current.name}"` }}
				/>
			}
			content={
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							<T k="tool.person.created.dialog.title" />
						</p>
						<p className="text-muted-foreground text-sm">
							<T k="tool.person.created.dialog.description" />
						</p>
					</div>
					<div>
						<h4 className="mb-2 text-sm font-medium">
							<T k="tool.person.created.dialog.section" />
						</h4>
						<p className="text-sm font-medium">{result.current.name}</p>
						{result.current.summary && (
							<p className="text-muted-foreground mt-1 text-sm">
								{result.current.summary}
							</p>
						)}
					</div>
					<div className="flex gap-3">
						<Button variant="outline" className="flex-1">
							<Link
								to="/people/$personID"
								params={{ personID: result.current.personId }}
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
									className="mr-2 size-3 animate-spin"
								/>
							) : (
								<HugeiconsIcon icon={RefreshIcon} className="mr-2 size-3" />
							)}
							<T k="tool.undo" />
						</Button>
					</div>
				</div>
			}
		/>
	)
}
