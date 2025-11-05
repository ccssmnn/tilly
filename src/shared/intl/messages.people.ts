import { messages, translate } from "@ccssmnn/intl"

export { basePeopleMessages, dePeopleMessages }

const basePeopleMessages = messages({
	// People page messages
	"people.title": "People",
	"people.pageTitle": "People - Tilly",
	"people.search.placeholder": "Find someone...",
	"people.search.clearLabel": "Clear Search",
	"people.newPersonLabel": "New Person",
	"people.empty.heading": "Each Person has their own space",
	"people.empty.description":
		"Tilly organizes your journal by person. Get started by adding someone important.",
	"people.empty.addButton": "Add someone special",
	"people.noActive.message": "Start adding the people who matter to you.",
	"people.noActive.addButton": "Add someone special",
	"people.search.noResults.message": 'No one found matching "{$query}"',
	"people.search.noResults.suggestion":
		"Try adjusting your search terms or add someone new",
	"people.deleted.count":
		".input {$count :number} .match $count one {{{$count} deleted person}} * {{{$count} deleted people}}",
	"people.deleted.heading": "Deleted ({$count :number})",

	// Person detail and form messages
	"person.new.title": "New Person",
	"person.new.description": "Add a new Person to Tilly",
	"person.create.button": "Create Person",
	"person.created.success": "Person created",
	"person.form.avatar.label": "Avatar",
	"person.form.name.label": "Name",
	"person.form.name.required": "Name is required",
	"person.form.summary.label": "Summary",
	"person.form.name.placeholder": "How do you call this person",
	"person.form.summary.placeholder": "A few key facts that help you find them",
	"person.form.avatar.upload": "Upload Image",
	"person.form.avatar.change": "Change Image",
	"person.form.avatar.remove": "Remove Avatar",
	"person.form.saving": "Saving...",
	"person.form.saveChanges": "Save Changes",
	"person.crop.title": "Crop Avatar",
	"person.crop.cancel": "Cancel",
	"person.crop.confirm": "Crop",
	"person.detail.pageTitle": "{$name} - Tilly",
	"person.detail.search.placeholder": "Search notes and reminders...",
	"person.detail.notes.tab": "Notes ({$count :number})",
	"person.detail.reminders.tab": "Reminder ({$count :number})",
	"person.detail.addNote": "Add Note",
	"person.detail.addReminder": "Add Reminder",
	"person.actions.title": "Actions",
	"person.edit.title": "Edit Person",
	"person.delete.title": "Delete Person",
	"person.restore.title": "Restore {$name}",
	"person.restore.deletionInfo": "This person was deleted {$timeAgo}",
	"person.restore.permanentDeletionWarning":
		" and is due for permanent deletion.",
	"person.restore.permanentDeletionCountdown":
		" and will be permanently deleted in {$days :number} days.",
	"person.restore.question": "Would you like to restore them?",
	"person.form.canvas.empty": "Canvas is empty",
	"person.added.suffix": "added {$ago}",
	"person.updated.suffix": " • Updated {$ago}",
	"person.permanentDelete.title": "Permanently Delete Person",
	"person.permanentDelete.confirmation":
		"Are you sure you want to permanently delete this person? This will also permanently delete all associated notes and reminders.",
})

const dePeopleMessages = translate(basePeopleMessages, {
	// People page messages
	"people.title": "Personen",
	"people.pageTitle": "Personen - Tilly",
	"people.search.placeholder": "Jemanden finden...",
	"people.search.clearLabel": "Suche löschen",
	"people.newPersonLabel": "Neue Person",
	"people.empty.heading": "Jede Person hat ihren eigenen Bereich",
	"people.empty.description":
		"Tilly organisiert dein Journal nach Personen. Beginne, indem du jemand Wichtiges hinzufügst.",
	"people.empty.addButton": "Jemand Besonderes hinzufügen",
	"people.noActive.message":
		"Fang an, die Menschen hinzuzufügen, die dir wichtig sind.",
	"people.noActive.addButton": "Jemand Besonderen hinzufügen",
	"people.search.noResults.message":
		'Keine passende Person zu "{$query}" gefunden',
	"people.search.noResults.suggestion":
		"Passe deine Suche an oder füge jemanden Neues hinzu",
	"people.deleted.count":
		".input {$count :number} .match $count one {{{$count} gelöschte Person}} * {{{$count} gelöschte Personen}}",
	"people.deleted.heading": "Gelöscht ({$count :number})",

	// Person detail and form messages
	"person.new.title": "Neue Person",
	"person.new.description": "Füge eine neue Person zu Tilly hinzu",
	"person.create.button": "Person erstellen",
	"person.created.success": "Person erstellt",
	"person.form.avatar.label": "Avatar",
	"person.form.name.label": "Name",
	"person.form.name.required": "Name ist erforderlich",
	"person.form.summary.label": "Zusammenfassung",
	"person.form.avatar.upload": "Bild hochladen",
	"person.form.avatar.change": "Bild ändern",
	"person.form.avatar.remove": "Avatar entfernen",
	"person.form.saving": "Speichern...",
	"person.form.saveChanges": "Änderungen speichern",
	"person.crop.title": "Avatar zuschneiden",
	"person.crop.cancel": "Abbrechen",
	"person.crop.confirm": "Zuschneiden",
	"person.detail.pageTitle": "{$name} - Tilly",
	"person.detail.search.placeholder": "Nach Notizen und Erinnerungen suchen...",
	"person.detail.notes.tab": "Notizen ({$count :number})",
	"person.detail.reminders.tab": "Erinnerungen ({$count :number})",
	"person.detail.addNote": "Notiz hinzufügen",
	"person.detail.addReminder": "Erinnerung hinzufügen",
	"person.form.name.placeholder": "Wie nennst du diese Person",
	"person.form.summary.placeholder":
		"Einige wichtige Fakten, die dir helfen, sie/ihn wiederzufinden",
	"person.actions.title": "Aktionen",
	"person.edit.title": "Person bearbeiten",
	"person.delete.title": "Person löschen",
	"person.restore.title": "{$name} wiederherstellen",
	"person.restore.deletionInfo": "Diese Person wurde {$timeAgo} gelöscht",
	"person.restore.permanentDeletionWarning":
		" und steht zur endgültigen Löschung an.",
	"person.restore.permanentDeletionCountdown":
		" und wird in {$days :number} Tagen endgültig gelöscht.",
	"person.restore.question": "Möchtest du sie wiederherstellen?",
	"person.form.canvas.empty": "Leinwand ist leer",
	"person.added.suffix": "hinzugefügt {$ago}",
	"person.updated.suffix": " • Aktualisiert {$ago}",
	"person.permanentDelete.title": "Person endgültig löschen",
	"person.permanentDelete.confirmation":
		"Möchtest du diese Person wirklich endgültig löschen? Dadurch werden alle zugehörigen Notizen und Erinnerungen dauerhaft gelöscht.",
})
