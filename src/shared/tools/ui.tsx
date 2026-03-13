import { CreatePersonResult } from "./person-create-ui"
import { UpdatePersonResult, DeletePersonResult } from "./person-update-ui"
import { ListPeopleResult, GetPersonDetailsResult } from "./person-read-ui"
import { AddNoteResult } from "./note-create-ui"
import { EditNoteResult, DeleteNoteResult } from "./note-update-ui"
import { ListNotesResult } from "./note-read-ui"
import { AddReminderResult } from "./reminder-create-ui"
import {
	UpdateReminderResult,
	RemoveReminderResult,
} from "./reminder-update-ui"
import { ListRemindersResult } from "./reminder-read-ui"
import { UserQuestionResult } from "./user-question-ui"

export { ToolResultRenderer }

const toolResultRenderers = {
	listPeople: ListPeopleResult,
	getPersonDetails: GetPersonDetailsResult,
	createPerson: CreatePersonResult,
	updatePerson: UpdatePersonResult,
	deletePerson: DeletePersonResult,
	addNote: AddNoteResult,
	listNotes: ListNotesResult,
	editNote: EditNoteResult,
	deleteNote: DeleteNoteResult,
	addReminder: AddReminderResult,
	updateReminder: UpdateReminderResult,
	removeReminder: RemoveReminderResult,
	listReminders: ListRemindersResult,
	userQuestion: UserQuestionResult,
} as const

type ToolName = keyof typeof toolResultRenderers

type ToolResultProps = {
	toolName: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	result: any
}

function ToolResultRenderer({ toolName, result }: ToolResultProps) {
	let renderer = toolResultRenderers[toolName as ToolName]
	if (!renderer) return null
	let Renderer = renderer
	return <Renderer result={result} />
}
