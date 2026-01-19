# File Organization

## Module Structure (all files)

1. Imports
2. `export { ... }` and `export type { ... }`
3. Main functions/components
4. Helpers, handlers, types, constants at bottom

## Component Modules (.tsx)

- Extract business logic to module-scope handler functions
- Keep components focused on UI state and rendering
- Custom hooks after components, before handlers

```ts
import { Button } from "#shared/ui/button"

export { NoteListItem }

function NoteListItem({ note }) {
  let [open, setOpen] = useState(false)
  return <Button onClick={() => handleEdit(note.id)}>Edit</Button>
}

async function handleEdit(noteId: string) {
  // Business logic here
}
```

## Tool/API Modules (.ts)

- Main operation functions first
- Helper functions in middle
- Constants, errors, type definitions at bottom
- AI tool definitions last

```ts
export { updateReminder, updateReminderTool }
export type { ReminderUpdated }

async function updateReminder(updates, options): Promise<ReminderUpdated> {
	// Main logic
}

function calculateNextDue(reminder): Date {
	// Helper
}

let errors = { PERSON_NOT_FOUND: "person not found" } as const

type ReminderUpdated = { operation: "update"; current: ReminderData }
```
