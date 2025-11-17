import { createListPeopleTool, createGetPersonDetailsTool } from "./person-read"
import { createListRemindersTool } from "./reminder-read"
import { createPersonTool } from "./person-create"
import { createUpdatePersonTool, createDeletePersonTool } from "./person-update"
import { createListNotesTool } from "./note-read"
import { createAddNoteTool } from "./note-create"
import { createEditNoteTool, createDeleteNoteTool } from "./note-update"
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
	createPerson: createPersonTool,
	userQuestion: userQuestionTool,
} as const

export function createServerTools(worker: Loaded<typeof UserAccount>) {
	return {
		listPeople: createListPeopleTool(worker),
		getPersonDetails: createGetPersonDetailsTool(worker),
		updatePerson: createUpdatePersonTool(worker),
		deletePerson: createDeletePersonTool(worker),
		listNotes: createListNotesTool(worker),
		addNote: createAddNoteTool(worker),
		editNote: createEditNoteTool(worker),
		deleteNote: createDeleteNoteTool(worker),
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

export type ToolSet = typeof clientTools & ReturnType<typeof createServerTools>
export type MyTools = InferUITools<ToolSet>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TillyUIMessage = UIMessage<MessageMetadata, {}, MyTools>
