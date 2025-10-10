import {
	listPeopleTool,
	listPeopleExecute,
	getPersonDetailsTool,
	getPersonDetailsExecute,
} from "./person-read"
import { listRemindersTool, listRemindersExecute } from "./reminder-read"
import { createPersonTool } from "./person-create"
import {
	updatePersonTool,
	updatePersonExecute,
	deletePersonTool,
	deletePersonExecute,
} from "./person-update"
import { addNoteTool, addNoteExecute } from "./note-create"
import {
	editNoteTool,
	editNoteExecute,
	deleteNoteTool,
	deleteNoteExecute,
} from "./note-update"
import { addReminderTool, addReminderExecute } from "./reminder-create"
import {
	updateReminderTool,
	updateReminderExecute,
	removeReminderTool,
	removeReminderExecute,
} from "./reminder-update"
import { userQuestionTool } from "./user-question"
import type { InferUITools, UIMessage } from "ai"
import { z } from "zod"
export let tools = {
	// Person tools
	listPeople: listPeopleTool,
	getPersonDetails: getPersonDetailsTool,
	createPerson: createPersonTool,
	updatePerson: updatePersonTool,
	deletePerson: deletePersonTool,

	// Note tools
	addNote: addNoteTool,
	editNote: editNoteTool,
	deleteNote: deleteNoteTool,

	// Reminder tools
	listReminders: listRemindersTool,
	addReminder: addReminderTool,
	updateReminder: updateReminderTool,
	removeReminder: removeReminderTool,

	// User interaction tools
	userQuestion: userQuestionTool,
} as const

export let toolExecutors = {
	listPeople: listPeopleExecute,
	getPersonDetails: getPersonDetailsExecute,
	updatePerson: updatePersonExecute,
	deletePerson: deletePersonExecute,
	addNote: addNoteExecute,
	editNote: editNoteExecute,
	deleteNote: deleteNoteExecute,
	listReminders: listRemindersExecute,
	addReminder: addReminderExecute,
	updateReminder: updateReminderExecute,
	removeReminder: removeReminderExecute,
} as const

// Message metadata schema
export const messageMetadataSchema = z.object({
	timezone: z.string(),
	locale: z.string(),
	userName: z.string(),
	timestamp: z.number(),
})

export type MessageMetadata = z.infer<typeof messageMetadataSchema>

// Types for UI integration
export type ToolSet = typeof tools
export type MyTools = InferUITools<ToolSet>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TillyUIMessage = UIMessage<MessageMetadata, {}, MyTools>
