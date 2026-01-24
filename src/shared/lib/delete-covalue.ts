import { deleteCoValues, type Loaded } from "jazz-tools"
import { Note, Person, Reminder, type UserAccount } from "../schema/user"

type LoadedPerson = Loaded<
	typeof Person,
	{ notes: { $each: true }; reminders: { $each: true } }
>

/**
 * Permanently deletes a note and all its images
 */
export async function permanentlyDeleteNote(note: Loaded<typeof Note>) {
	await deleteCoValues(Note, note.$jazz.id, {
		resolve: { images: { $each: true } },
	})
}

/**
 * Permanently deletes a reminder
 */
export async function permanentlyDeleteReminder(
	reminder: Loaded<typeof Reminder>,
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
export async function permanentlyDeletePerson(person: LoadedPerson) {
	// Delete all notes with their images
	for (let note of person.notes.values()) {
		if (!note) continue
		try {
			await permanentlyDeleteNote(note)
		} catch {
			// Note may not be accessible, skip
		}
	}

	// Delete all reminders
	for (let reminder of person.reminders.values()) {
		if (!reminder) continue
		try {
			await permanentlyDeleteReminder(reminder)
		} catch {
			// Reminder may not be accessible, skip
		}
	}

	// Delete person with avatar and remaining nested data
	await deleteCoValues(Person, person.$jazz.id, {
		resolve: {
			avatar: true,
			inactiveNotes: { $each: { images: { $each: true } } },
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
				people: {
					$each: { notes: { $each: true }; reminders: { $each: true } }
				}
				inactivePeople: {
					$each: { notes: { $each: true }; reminders: { $each: true } }
				}
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
