import { messages, translate } from "@ccssmnn/intl"

export { baseNotesMessages, deNotesMessages }

const baseNotesMessages = messages({
	// Notes collection messages
	"notes.empty.withSearch": 'No notes found matching "{$query}"',
	"notes.empty.noSearch": "No notes yet",
	"notes.empty.suggestion.withSearch": "Try adjusting your search terms",
	"notes.empty.suggestion.noSearch":
		"Document your conversations, experiences, and little things you learn about them",
	"notes.deleted.count":
		".input {$count :number} .match $count one {{{$count} deleted note}} * {{{$count} deleted notes}}",
	"notes.deleted.heading": "Deleted ({$count :number})",
	"notes.created.success": "Note created",

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

	// Note placeholders
	"note.placeholder.1":
		"Great conversation about her new job and weekend plans...",
	"note.placeholder.2":
		"Celebrated at that Italian place downtown, he loved the surprise...",
	"note.placeholder.3":
		"Lovely afternoon stroll, talked about summer vacation ideas...",
	"note.placeholder.4":
		"Long overdue chat about life updates and future goals...",
	"note.placeholder.5":
		"Wonderful time catching up on family news and shared notes...",
	"note.placeholder.6":
		"Productive discussion about the project and next steps...",
})

const deNotesMessages = translate(baseNotesMessages, {
	// Notes collection messages
	"notes.empty.withSearch": 'Keine passenden Notizen zu "{$query}" gefunden',
	"notes.empty.noSearch": "Noch keine Notizen",
	"notes.empty.suggestion.withSearch": "Passe deine Suchbegriffe an",
	"notes.empty.suggestion.noSearch":
		"Dokumentiere Gespräche, Erlebnisse und kleine Dinge, die du über sie lernst",
	"notes.deleted.count":
		".input {$count :number} .match $count one {{{$count} gelöschte Notiz}} * {{{$count} gelöschte Notizen}}",
	"notes.deleted.heading": "Gelöscht ({$count :number})",
	"notes.created.success": "Notiz erstellt",

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

	// Note placeholders
	"note.placeholder.1":
		"Tolles Gespräch über ihren neuen Job und Wochenendpläne...",
	"note.placeholder.2":
		"Im italienischen Restaurant gefeiert, er liebte die Überraschung...",
	"note.placeholder.3":
		"Schöner Spaziergang am Nachmittag, über Sommerurlaubs-Ideen gesprochen...",
	"note.placeholder.4":
		"Längst überfälliges Gespräch über Neuigkeiten und Ziele...",
	"note.placeholder.5":
		"Wunderbares Wiedersehen mit Familiennachrichten und Erinnerungen...",
	"note.placeholder.6":
		"Produktive Diskussion über das Projekt und nächste Schritte...",
})
