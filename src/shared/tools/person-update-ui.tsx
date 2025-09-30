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
import { ArrowCounterclockwise, Pause, People } from "react-bootstrap-icons"
import { Link } from "@tanstack/react-router"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import {
	updatePersonTool,
	deletePersonTool,
	updatePerson,
} from "#shared/tools/person-update"
import { cn } from "#app/lib/utils"

type _UpdatePersonTool = InferUITool<typeof updatePersonTool>
type _DeletePersonTool = InferUITool<typeof deletePersonTool>

export { UpdatePersonResult, DeletePersonResult }

function UpdatePersonResult({
	result,
}: {
	result: _UpdatePersonTool["output"]
}) {
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
			// Now we have access to previous values for proper undo functionality
			await updatePerson(result.personId, {
				name: result.previous.name,
				summary: result.previous.summary,
			})
			setIsUndone(true)
			addChatMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: t("tool.person.updated.undo.success", {
							name: result.current.name,
						}),
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
				<span className="text-gray-500 line-through">
					<T
						k="tool.person.updated.undone"
						params={{ name: result.current.name }}
					/>
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
						k="tool.person.updated.message"
						params={{ name: `"${result.current.name}"` }}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.person.updated.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.person.updated.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<div>
							<h4 className="mb-2 text-sm font-medium">
								<T k="tool.person.updated.dialog.current" />
							</h4>
							<p className="text-sm font-medium">{result.current.name}</p>
							{result.current.summary && (
								<p className="text-muted-foreground mt-1 text-sm">
									{result.current.summary}
								</p>
							)}
						</div>
						<div className="text-muted-foreground">
							<h4 className="mb-2 text-sm font-medium">
								<T k="tool.person.updated.dialog.previous" />
							</h4>
							<p className="text-sm font-medium">{result.previous.name}</p>
							{result.previous.summary && (
								<p className="mt-1 text-sm">{result.previous.summary}</p>
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

function DeletePersonResult({
	result,
}: {
	result: _DeletePersonTool["output"]
}) {
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
			await updatePerson(result.personId, { deletedAt: undefined })
			setIsUndone(true)
			addChatMessage({
				id: `undo-${nanoid()}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: t("tool.person.deleted.undo.success", { name: result.name }),
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
				<span className="text-gray-500 line-through">
					<T k="tool.person.deleted.undone" params={{ name: result.name }} />
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
						k="tool.person.deleted.message"
						params={{ name: `"${result.name}"` }}
					/>
				</span>
			</ToolMessageWrapper>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="tool.person.deleted.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="tool.person.deleted.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<div>
							<h4 className="mb-2 text-sm font-medium">
								<T k="tool.person.deleted.dialog.section" />
							</h4>
							<p className="text-sm font-medium">{result.name}</p>
							{result.summary && (
								<p className="text-muted-foreground mt-1 text-sm">
									{result.summary}
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
			<People className="h-4 w-4" />
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
