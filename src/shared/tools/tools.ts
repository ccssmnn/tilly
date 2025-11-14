import { createListPeopleTool, createGetPersonDetailsTool } from "./person-read"
import { createListRemindersTool } from "./reminder-read"
import { createPersonTool } from "./person-create"
import { createUpdatePersonTool, createDeletePersonTool } from "./person-update"
import { addNoteTool, addNoteExecute } from "./note-create"
import {
	editNoteTool,
	editNoteExecute,
	deleteNoteTool,
	deleteNoteExecute,
} from "./note-update"
import { listNotesTool, listNotesExecute } from "./note-read"
import { createAddReminderTool } from "./reminder-create"
import {
	createUpdateReminderTool,
	createRemoveReminderTool,
} from "./reminder-update"
import { userQuestionTool } from "./user-question"
import type { InferUITools, UIMessage } from "ai"
import { z } from "zod"
import type { Loaded } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"

export let clientTools = {
	// Person tools
	createPerson: createPersonTool,

	// Note tools
	listNotes: listNotesTool,
	addNote: addNoteTool,
	editNote: editNoteTool,
	deleteNote: deleteNoteTool,

	// User interaction tools
	userQuestion: userQuestionTool,
} as const

export let clientToolExecutors = {
	listNotes: listNotesExecute,
	addNote: addNoteExecute,
	editNote: editNoteExecute,
	deleteNote: deleteNoteExecute,
} as const

export function createServerTools(worker: Loaded<typeof UserAccount>) {
	return {
		listPeople: createListPeopleTool(worker),
		getPersonDetails: createGetPersonDetailsTool(worker),
		updatePerson: createUpdatePersonTool(worker),
		deletePerson: createDeletePersonTool(worker),
		listReminders: createListRemindersTool(worker),
		addReminder: createAddReminderTool(worker),
		updateReminder: createUpdateReminderTool(worker),
		removeReminder: createRemoveReminderTool(worker),
	}
}

export const messageMetadataSchema = z.object({
	timezone: z.string(),
	locale: z.string(),
	userName: z.string(),
	timestamp: z.number(),
})

export type MessageMetadata = z.infer<typeof messageMetadataSchema>

// Type for addToolResult function from AI SDK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AddToolResultFunction = (...args: any[]) => void

export type ToolSet = typeof clientTools
export type MyTools = InferUITools<ToolSet>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TillyUIMessage = UIMessage<MessageMetadata, {}, MyTools>
