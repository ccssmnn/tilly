import { type ReactNode, useState } from "react"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import {
	ToolMessageAccordion,
	ToolMessageWrapper as SharedToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import {
	RefreshIcon,
	PauseIcon,
	UserMultipleIcon,
	Tick02Icon,
	Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useChatHistory } from "#app/hooks/use-chat-history"
import {
	createPersonExecute,
	createPersonTool,
} from "#shared/tools/person-create"
import type { AddToolResultFunction } from "#shared/tools/tools"
import type { InferUITool } from "ai"
import { updatePerson } from "#shared/tools/person-update"
import { T, useIntl } from "#shared/intl/setup"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#shared/ui/card"
import { TypographyMuted } from "#shared/ui/typography"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"

export { CreatePersonConfirmation, CreatePersonResult }

type CreatePersonToolUI = InferUITool<typeof createPersonTool>

function CreatePersonConfirmation({
	part,
	addToolResult,
}: {
	part: {
		toolCallId: string
		input: CreatePersonToolUI["input"]
		state: "input-available"
	}
	addToolResult: AddToolResultFunction
}) {
	let me = useAccount(UserAccount)
	let [isCreating, setIsCreating] = useState(false)
	let t = useIntl()

	let handleConfirm = async () => {
		if (!me.$isLoaded) return
		setIsCreating(true)
		let res = await tryCatch(createPersonExecute(me.$jazz.id, part.input))
		if (res.ok) {
			addToolResult({
				tool: "createPerson",
				toolCallId: part.toolCallId,
				output: res.data,
			})
		} else {
			addToolResult({
				tool: "createPerson",
				toolCallId: part.toolCallId,
				output: {
					error:
						res.error instanceof Error
							? res.error.message
							: t("tool.error.failedToCreate"),
				},
			})
		}
		setIsCreating(false)
	}

	let handleReject = () => {
		addToolResult({
			tool: "createPerson",
			toolCallId: part.toolCallId,
			output: {
				cancelled: true,
				reason: t("tool.person.createCancel.reason"),
			},
		})
	}

	return (
		<Card className="border-primary">
			<CardHeader>
				<CardTitle className="font-medium">
					<T
						k="tool.person.createConfirm.title"
						params={{ name: part.input.name }}
					/>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<TypographyMuted>
					<T k="tool.person.createConfirm.description" />
				</TypographyMuted>
			</CardContent>
			<CardFooter className="flex justify-end gap-3">
				<Button
					variant="secondary"
					onClick={handleReject}
					disabled={isCreating}
				>
					<HugeiconsIcon icon={Cancel01Icon} className="mr-1 h-4 w-4" />
					<T k="tool.cancel" />
				</Button>
				<Button variant="default" onClick={handleConfirm} disabled={isCreating}>
					<HugeiconsIcon icon={Tick02Icon} className="mr-1 h-4 w-4" />
					<T k="tool.create" />
				</Button>
			</CardFooter>
		</Card>
	)
}

function CreatePersonResult({
	result,
}: {
	result: CreatePersonToolUI["output"]
}) {
	let me = useAccount(UserAccount)
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDrawerOpen] = useState(false)
	let { addMessage } = useChatHistory()
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper>
				❌ {typeof result.error === "string" ? result.error : result.error}
			</ToolMessageWrapper>
		)
	}

	if ("cancelled" in result) {
		return (
			<ToolMessageWrapper>
				<span className="text-muted-foreground">🚫 {result.reason}</span>
			</ToolMessageWrapper>
		)
	}

	let handleUndo = async () => {
		if (!me.$isLoaded) return
		setIsUndoing(true)
		setDrawerOpen(false)
		try {
			await updatePerson(result.personId, { deletedAt: new Date() }, me)
			setIsUndone(true)
			addMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: t("tool.person.created.undo.success", { name: result.name }),
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
			<ToolMessageWrapper>
				<span className="text-muted-foreground line-through">
					<T k="tool.person.created.undone" params={{ name: result.name }} />
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
					params={{ name: `"${result.name}"` }}
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
						<p className="text-sm font-medium">{result.name}</p>
						{result.summary && (
							<p className="text-muted-foreground mt-1 text-sm">
								{result.summary}
							</p>
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
			icon={UserMultipleIcon}
			onClick={onClick}
			dialogOpen={dialogOpen}
		>
			{children}
		</SharedToolMessageWrapper>
	)
}
