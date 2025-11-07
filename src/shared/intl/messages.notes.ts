import { messages, translate } from "@ccssmnn/intl"

export { baseNotesMessages, deNotesMessages }

const baseNotesMessages = messages({
	// Notes collection messages
	"notes.pageTitle": "Notes - Tilly",
	"notes.title": "Notes",
	"notes.addButton": "Add Note",
	"notes.search.placeholder": "Search notes...",
	"notes.noPeople.title": "No People Yet",
	"notes.noPeople.description":
		"Add people to start creating and viewing notes.",
	"notes.empty.title": "No Notes Yet",
	"notes.empty.description":
		"Notes are where you journal what you want to remember about someone.",
	"notes.empty.withSearch": 'No notes found matching "{$query}"',
	"notes.empty.noSearch": "No notes yet",
	"notes.empty.suggestion.withSearch": "Try adjusting your search terms",
	"notes.empty.suggestion.noSearch":
		"Notes are where you journal what you want to remember about someone.",
	"notes.deleted.count":
		".input {$count :number} .match $count one {{{$count} deleted note}} * {{{$count} deleted notes}}",
	"notes.deleted.heading": "Deleted ({$count :number})",
	"notes.created.success": "Note created",
	"notes.noResults.message": 'No notes found matching "{$query}"',
	"notes.noResults.suggestion": "Try adjusting your search terms",
	"notes.allCaughtUp.title": "All Caught Up",
	"notes.allCaughtUp.description":
		"You've seen all your notes. Create more by adding notes to people!",

	// Person selection for notes
	"note.select.title": "Select Person",
	"note.select.description": "Choose who this note is about.",
	"note.select.placeholder": "Select a person...",
	"note.select.empty": "No people found.",
	"note.select.search": "Search people...",

	// Individual note messages
	"note.add.title": "Add a Note",
	"note.add.description":
		"Capture a moment, conversation, or experience you shared together.",
	"note.actions.title": "Note Actions",
	"note.actions.description": "What would you like to do with this note?",
	"note.actions.edit": "Edit",
	"note.actions.delete": "Delete",
	"note.actions.pin": "Pin",
	"note.actions.unpin": "Unpin",
	"note.actions.viewPerson": "View Person",
	"note.status.pinned": "Pinned",
	"note.status.deleted": "Deleted",
	"note.showMore": "Show more",
	"note.showLess": "Show less",
	"note.timestamp.editedSuffix": " • Edited {$ago}",
	"note.restore.title": "Restore Note",
	"note.restore.deletionInfo": "This note was deleted {$timeAgo}",
	"note.restore.permanentDeletionWarning":
		" and is due for permanent deletion.",
	"note.restore.permanentDeletionCountdown":
		" and will be permanently deleted in {$days :number} days.",
	"note.restore.question": "Would you like to restore it?",
	"note.restore.button": "Restore Note",
	"note.restore.permanentDelete": "Permanently Delete",
	"note.permanentDelete.title": "Permanently Delete Note",
	"note.permanentDelete.confirmation":
		"Are you sure you want to permanently delete this note? This action cannot be undone.",
	"note.permanentDelete.cancel": "Cancel",
	"note.permanentDelete.confirm": "Permanently Delete",
	"note.toast.updated": "Note updated",
	"note.toast.updateUndone": "Note update undone",
	"note.toast.deleted": "Note deleted - will be permanently deleted in 30 days",
	"note.toast.restored": "Note restored",
	"note.toast.permanentlyDeleted": "Note permanently deleted",
	"note.toast.pinned": "Note pinned",
	"note.toast.unpinned": "Note unpinned",
	"note.toast.added": "Note added",
	"note.toast.removed": "Note removed",

	"note.form.placeholder": "Document your conversation and what matters most",
})

const deNotesMessages = translate(baseNotesMessages, {
	// Notes collection messages
	"notes.pageTitle": "Notizen - Tilly",
	"notes.title": "Notizen",
	"notes.addButton": "Notiz hinzufügen",
	"notes.search.placeholder": "Notizen durchsuchen...",
	"notes.noPeople.title": "Noch keine Personen",
	"notes.noPeople.description":
		"Füge Personen hinzu, um Notizen zu erstellen und anzusehen.",
	"notes.empty.title": "Noch keine Notizen",
	"notes.empty.description":
		"Notizen sind der Ort, an dem du aufschreibst, woran du dich über jemanden erinnern möchtest.",
	"notes.empty.withSearch": 'Keine passenden Notizen zu "{$query}" gefunden',
	"notes.empty.noSearch": "Noch keine Notizen",
	"notes.empty.suggestion.withSearch": "Passe deine Suchbegriffe an",
	"notes.empty.suggestion.noSearch":
		"Notizen sind der Ort, an dem du aufschreibst, woran du dich über jemanden erinnern möchtest.",
	"notes.deleted.count":
		".input {$count :number} .match $count one {{{$count} gelöschte Notiz}} * {{{$count} gelöschte Notizen}}",
	"notes.deleted.heading": "Gelöscht ({$count :number})",
	"notes.created.success": "Notiz erstellt",
	"notes.noResults.message": 'Keine passenden Notizen zu "{$query}" gefunden',
	"notes.noResults.suggestion": "Passe deine Suchbegriffe an",
	"notes.allCaughtUp.title": "Alles erledigt",
	"notes.allCaughtUp.description":
		"Du hast alle deine Notizen gesehen. Erstelle mehr, indem du Personen Notizen hinzufügst!",

	// Person selection for notes
	"note.select.title": "Person auswählen",
	"note.select.description": "Wähle, über wen diese Notiz ist.",
	"note.select.placeholder": "Person auswählen...",
	"note.select.empty": "Keine Personen gefunden.",
	"note.select.search": "Personen suchen...",

	// Individual note messages
	"note.add.title": "Notiz hinzufügen",
	"note.add.description":
		"Halte einen Moment, ein Gespräch oder eine gemeinsame Erfahrung fest.",
	"note.actions.title": "Notizaktionen",
	"note.actions.description": "Was möchtest du mit dieser Notiz tun?",
	"note.actions.edit": "Bearbeiten",
	"note.actions.delete": "Löschen",
	"note.actions.pin": "Anheften",
	"note.actions.unpin": "Lösen",
	"note.actions.viewPerson": "Person ansehen",
	"note.status.pinned": "Angeheftet",
	"note.status.deleted": "Gelöscht",
	"note.showMore": "Mehr anzeigen",
	"note.showLess": "Weniger anzeigen",
	"note.timestamp.editedSuffix": " • Bearbeitet {$ago}",
	"note.restore.deletionInfo": "Diese Notiz wurde {$timeAgo} gelöscht",
	"note.restore.title": "Notiz wiederherstellen",
	"note.restore.permanentDeletionWarning":
		" und steht zur endgültigen Löschung an.",
	"note.restore.permanentDeletionCountdown":
		" und wird in {$days :number} Tagen endgültig gelöscht.",
	"note.restore.question": "Möchtest du sie wiederherstellen?",
	"note.restore.button": "Notiz wiederherstellen",
	"note.restore.permanentDelete": "Endgültig löschen",
	"note.permanentDelete.title": "Notiz endgültig löschen",
	"note.permanentDelete.confirmation":
		"Möchtest du diese Notiz wirklich endgültig löschen? Dies kann nicht rückgängig gemacht werden.",
	"note.permanentDelete.cancel": "Abbrechen",
	"note.permanentDelete.confirm": "Endgültig löschen",
	"note.toast.updated": "Notiz aktualisiert",
	"note.toast.updateUndone": "Notiz-Aktualisierung rückgängig gemacht",
	"note.toast.deleted": "Notiz gelöscht – wird in 30 Tagen endgültig gelöscht",
	"note.toast.restored": "Notiz wiederhergestellt",
	"note.toast.permanentlyDeleted": "Notiz endgültig gelöscht",
	"note.toast.pinned": "Notiz angeheftet",
	"note.toast.unpinned": "Notiz gelöst",
	"note.toast.added": "Notiz hinzugefügt",
	"note.toast.removed": "Notiz entfernt",

	"note.form.placeholder":
		"Dokumentiere euer Gespräch und was am wichtigsten ist",
})
