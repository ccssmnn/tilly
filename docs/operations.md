# Operations Pattern

Centralized CRUD operations in `operations.ts` files.

## Structure

- Return `{ current, previous, _ref }` for undo support
- Pair with `undo*Operation()` functions
- Use `tryCatch` wrapper for error handling

```ts
async function updateReminder(updates, options): Promise<ReminderUpdated> {
	let result = await tryCatch(Person.load(options.personId))
	if (!result.ok) throw errors.PERSON_NOT_FOUND

	return { operation: "update", current, previous, _ref }
}

function undoUpdateReminder(result: ReminderUpdated) {
	// Restore previous state using _ref
}
```
