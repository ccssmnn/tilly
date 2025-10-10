import { CreatePersonResult } from "./person-create-ui"
import { UpdatePersonResult, DeletePersonResult } from "./person-update-ui"
import { ListPeopleResult, GetPersonDetailsResult } from "./person-read-ui"
import { AddNoteResult } from "./note-create-ui"
import { EditNoteResult, DeleteNoteResult } from "./note-update-ui"
import { AddReminderResult } from "./reminder-create-ui"
import {
	UpdateReminderResult,
	RemoveReminderResult,
} from "./reminder-update-ui"
import { ListRemindersResult } from "./reminder-read-ui"
import { UserQuestionResult } from "./user-question-ui"

export { ToolResultRenderer }

type ToolResultProps = {
	toolName: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	result: any
	userId?: string
}

function ToolResultRenderer({ toolName, result, userId }: ToolResultProps) {
	switch (toolName) {
		case "listPeople":
			return <ListPeopleResult result={result} />
		case "getPersonDetails":
			return <GetPersonDetailsResult result={result} />
		case "createPerson":
			return <CreatePersonResult result={result} />
		case "updatePerson":
			return <UpdatePersonResult result={result} />
		case "deletePerson":
			return <DeletePersonResult result={result} />
		case "addNote":
			return <AddNoteResult result={result} />
		case "editNote":
			return <EditNoteResult result={result} />
		case "deleteNote":
			return <DeleteNoteResult result={result} />
		case "addReminder":
			return <AddReminderResult result={result} userId={userId!} />
		case "updateReminder":
			return <UpdateReminderResult result={result} userId={userId!} />
		case "removeReminder":
			return <RemoveReminderResult result={result} userId={userId!} />
		case "listReminders":
			return <ListRemindersResult result={result} />
		case "userQuestion":
			return <UserQuestionResult result={result} />
		default:
			return null
	}
}
