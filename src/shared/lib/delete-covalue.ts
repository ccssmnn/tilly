import { deleteCoValues, type Loaded, type ID, type CoValue } from "jazz-tools"
import { Note, Person, Reminder, type UserAccount } from "../schema/user"

/**
 * Permanently deletes a note and all its images
 */
export async function permanentlyDeleteNote(
	note: Loaded<typeof Note> | { $jazz: { id: ID<CoValue> } },
) {
	await deleteCoValues(Note, note.$jazz.id, {
		resolve: { images: { $each: true } },
	})
}

/**
 * Permanently deletes a reminder
 */
export async function permanentlyDeleteReminder(
	reminder: Loaded<typeof Reminder> | { $jazz: { id: ID<CoValue> } },
) {
	await deleteCoValues(Reminder, reminder.$jazz.id)
}

/**
 * Permanently deletes a person and all their data:
 * - Avatar image
 * - All notes (with their images)
 * - All reminders
 * - Inactive notes and reminders lists
 */
export async function permanentlyDeletePerson(
	person: Loaded<typeof Person> | { $jazz: { id: ID<CoValue> } },
) {
	// Delete person with all nested data
	await deleteCoValues(Person, person.$jazz.id, {
		resolve: {
			avatar: true,
			notes: { $each: { images: { $each: true } } },
			inactiveNotes: { $each: { images: { $each: true } } },
			reminders: { $each: true },
			inactiveReminders: { $each: true },
		},
	})
}

/**
 * Permanently deletes all people and their data from an account
 */
export async function permanentlyDeleteAllPeople(
	me: Loaded<
		typeof UserAccount,
		{
			root: {
				people: { $each: true }
				inactivePeople: { $each: true }
			}
		}
	>,
) {
	// Delete all active people
	for (let person of me.root.people.values()) {
		if (!person) continue
		try {
			await permanentlyDeletePerson(person)
		} catch {
			// Person may not be accessible, skip
		}
	}

	// Delete all inactive people
	if (me.root.inactivePeople) {
		for (let person of me.root.inactivePeople.values()) {
			if (!person) continue
			try {
				await permanentlyDeletePerson(person)
			} catch {
				// Person may not be accessible, skip
			}
		}
	}
}
