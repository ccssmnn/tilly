import { type ReactNode, useState } from "react"
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
	People,
	Check,
	X,
} from "react-bootstrap-icons"
import { Link } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import {
	createPersonExecute,
	createPersonTool,
} from "#shared/tools/person-create"
import type { InferUITool } from "ai"
import { updatePerson } from "#shared/tools/person-update"
import { cn } from "#app/lib/utils"
import { T, useIntl } from "#shared/intl/setup"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#shared/ui/card"
import { TypographyMuted } from "#shared/ui/typography"

export { CreatePersonConfirmation, CreatePersonResult }

type CreatePersonToolUI = InferUITool<typeof createPersonTool>

function CreatePersonConfirmation({
	part,
	addToolResult,
	userId,
}: {
	part: {
		toolCallId: string
		input: CreatePersonToolUI["input"]
		state: "input-available"
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	addToolResult: Function
	userId: string
}) {
	let [isCreating, setIsCreating] = useState(false)
	let t = useIntl()

	let handleConfirm = async () => {
		setIsCreating(true)
		try {
			let result = await createPersonExecute(userId, part.input)
			addToolResult({
				tool: "createPerson",
				toolCallId: part.toolCallId,
				output: result,
			})
		} catch (error) {
			addToolResult({
				tool: "createPerson",
				toolCallId: part.toolCallId,
				output: {
					error:
						error instanceof Error
							? error.message
							: t("tool.error.failedToCreate"),
				},
			})
		} finally {
			setIsCreating(false)
		}
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
					<X />
					<T k="tool.cancel" />
				</Button>
				<Button variant="default" onClick={handleConfirm} disabled={isCreating}>
					<Check />
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
	let [isUndoing, setIsUndoing] = useState(false)
	let [isUndone, setIsUndone] = useState(false)
	let [dialogOpen, setDialogOpen] = useState(false)
	let { addChatMessage } = useAppStore()
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
		setIsUndoing(true)
		setDialogOpen(false)
		try {
			await updatePerson(result.personId, { deletedAt: new Date() })
			setIsUndone(true)
			addChatMessage({
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
				<span className="text-muted-foreground line-through">
					<T k="tool.person.created.undone" params={{ name: result.name }} />
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
						k="tool.person.created.message"
						params={{ name: `"${result.name}"` }}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.person.created.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.person.created.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
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
							<Button asChild variant="outline" className="flex-1">
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
			<People className="h-4 w-4" />
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
