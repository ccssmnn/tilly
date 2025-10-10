import { Markdown } from "#shared/ui/markdown"
import { ToolResultRenderer } from "#shared/tools/ui"
import { CreatePersonConfirmation } from "#shared/tools/person-create-ui"
import { UserQuestionConfirmation } from "#shared/tools/user-question-ui"
import type { AddToolResultFunction, TillyUIMessage } from "#shared/tools/tools"

export function UserMessage({ message }: { message: TillyUIMessage }) {
	if (message.role !== "user") return null

	let textContent = ""
	if (message.parts) {
		let textParts = message.parts.filter(part => part.type === "text")
		textContent = textParts.map(part => part.text).join("")
	} else if ("content" in message && typeof message.content === "string") {
		textContent = message.content
	}

	return (
		<div className="bg-primary/25 rounded-lg px-4 py-2 whitespace-pre-wrap select-text">
			{textContent}
		</div>
	)
}

export function AssistantMessage({
	message,
	userId,
	addToolResult,
}: {
	message: TillyUIMessage
	userId?: string
	addToolResult?: AddToolResultFunction
}) {
	if (message.role !== "assistant") return null

	if (!message.parts) {
		let textContent =
			"content" in message && typeof message.content === "string"
				? message.content
				: ""
		if (!textContent) return null

		return (
			<div className="mb-4 select-text">
				<Markdown>{textContent}</Markdown>
			</div>
		)
	}

	let renderedParts = []
	let currentTextChunk = ""

	for (let i = 0; i < message.parts.length; i++) {
		let part = message.parts[i]

		if (part.type === "text") {
			currentTextChunk += part.text
		} else if (
			part.type === "tool-createPerson" &&
			"state" in part &&
			part.state === "input-available" &&
			addToolResult
		) {
			if (currentTextChunk.trim()) {
				renderedParts.push(
					<div key={`text-${i}`} className="select-text">
						<Markdown>{currentTextChunk}</Markdown>
					</div>,
				)
				currentTextChunk = ""
			}
			renderedParts.push(
				<CreatePersonConfirmation
					key={`confirmation-${i}`}
					part={part}
					addToolResult={addToolResult}
					userId={userId!}
				/>,
			)
		} else if (
			part.type === "tool-userQuestion" &&
			"state" in part &&
			part.state === "input-available" &&
			addToolResult
		) {
			if (currentTextChunk.trim()) {
				renderedParts.push(
					<div key={`text-${i}`} className="select-text">
						<Markdown>{currentTextChunk}</Markdown>
					</div>,
				)
				currentTextChunk = ""
			}
			renderedParts.push(
				<UserQuestionConfirmation
					key={`question-${i}`}
					part={part}
					addToolResult={addToolResult}
				/>,
			)
		} else if (
			part.type.startsWith("tool-") &&
			"state" in part &&
			part.state === "output-available" &&
			"output" in part &&
			userId
		) {
			if (currentTextChunk.trim()) {
				renderedParts.push(
					<div key={`text-${i}`} className="select-text">
						<Markdown>{currentTextChunk}</Markdown>
					</div>,
				)
				currentTextChunk = ""
			}

			let toolName = part.type.replace("tool-", "")
			renderedParts.push(
				<ToolResultRenderer
					key={`tool-${i}`}
					toolName={toolName}
					result={part.output}
					userId={userId}
				/>,
			)
		}
	}

	if (currentTextChunk.trim()) {
		renderedParts.push(
			<div key="text-final" className="select-text">
				<Markdown>{currentTextChunk}</Markdown>
			</div>,
		)
	}

	if (renderedParts.length === 0) return null

	return <div className="mb-4 space-y-2">{renderedParts}</div>
}

export function ToolMessage({
	message,
	userId,
}: {
	message: TillyUIMessage
	userId: string
}) {
	if (message.role !== "assistant") return null

	return (
		<div className="mb-4 space-y-2 select-text">
			{message.parts?.map((part, index) => {
				if (part.type === "file") return null
				if (part.type === "dynamic-tool") return null
				if (part.type === "step-start") return null
				if (part.type === "reasoning") return null
				if (part.type === "source-url") return null
				if (part.type === "source-document") return null

				if (part.type === "text") return null

				if (part.state !== "output-available") return null
				if (!part.type.startsWith("tool-")) return null

				let toolName = part.type.replace("tool-", "")
				return (
					<ToolResultRenderer
						key={index}
						toolName={toolName}
						result={part.output}
						userId={userId}
					/>
				)
			})}
		</div>
	)
}

export function MessageRenderer({
	message,
	userId,
	addToolResult,
}: {
	message: TillyUIMessage
	userId: string
	addToolResult?: AddToolResultFunction
}) {
	switch (message.role) {
		case "user":
			return <UserMessage message={message} />
		case "assistant":
			return (
				<AssistantMessage
					message={message}
					userId={userId}
					addToolResult={addToolResult}
				/>
			)
		default:
			return null
	}
}
