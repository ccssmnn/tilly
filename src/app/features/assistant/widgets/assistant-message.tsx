import { Markdown } from "#shared/ui/markdown"
import { PersonCreateConfirmation } from "../parts/person-create-confirmation"
import { PersonCreateResult } from "../parts/person-create-result"
import { PersonUpdateResult } from "../parts/person-update-result"
import { PersonDeleteResult } from "../parts/person-delete-result"
import {
	ListPeopleResult,
	GetPersonDetailsResult,
} from "../parts/person-read-result"
import { NoteCreateResult } from "../parts/note-create-result"
import { NoteUpdateResult } from "../parts/note-update-result"
import { NoteDeleteResult } from "../parts/note-delete-result"
import { NoteReadResult } from "../parts/note-read-result"
import { ReminderCreateResult } from "../parts/reminder-create-result"
import { ReminderUpdateResult } from "../parts/reminder-update-result"
import { ReminderDeleteResult } from "../parts/reminder-delete-result"
import { ReminderReadResult } from "../parts/reminder-read-result"
import { UserQuestionConfirmation } from "../parts/user-question-confirmation"
import { UserQuestionResult } from "../parts/user-question-result"
import { useChatHistory } from "../hooks/use-chat-history"
import type { AddToolResultFunction, TillyUIMessage } from "#shared/tools/tools"

export { AssistantMessage }

const toolResultRenderers = {
	listPeople: ListPeopleResult,
	getPersonDetails: GetPersonDetailsResult,
	createPerson: PersonCreateResult,
	updatePerson: PersonUpdateResult,
	deletePerson: PersonDeleteResult,
	addNote: NoteCreateResult,
	listNotes: NoteReadResult,
	editNote: NoteUpdateResult,
	deleteNote: NoteDeleteResult,
	addReminder: ReminderCreateResult,
	updateReminder: ReminderUpdateResult,
	removeReminder: ReminderDeleteResult,
	listReminders: ReminderReadResult,
	userQuestion: UserQuestionResult,
} as const

type ToolName = keyof typeof toolResultRenderers

function AssistantMessage({
	message,
	addToolResult,
}: {
	message: TillyUIMessage
	addToolResult?: AddToolResultFunction
}) {
	let { addMessage } = useChatHistory()

	if (message.role !== "assistant") return null

	if (!message.parts) {
		let textContent =
			"content" in message && typeof message.content === "string"
				? message.content
				: ""
		if (!textContent) return null

		return (
			<div className="select-text">
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
				<PersonCreateConfirmation
					key={`confirmation-${i}`}
					part={part}
					addToolResult={addToolResult}
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
			"output" in part
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let Renderer = toolResultRenderers[toolName as ToolName] as any
			if (Renderer) {
				renderedParts.push(
					<Renderer key={`tool-${i}`} result={part.output} addMessage={addMessage} />,
				)
			}
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

	return <div className="space-y-4">{renderedParts}</div>
}
