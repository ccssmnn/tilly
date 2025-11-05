import { messages, translate } from "@ccssmnn/intl"

export { baseRemindersMessages, deRemindersMessages }

const baseRemindersMessages = messages({
	// Reminders page messages
	"reminders.title": "Reminders",
	"reminders.pageTitle": "Reminders - Tilly",
	"reminders.search.placeholder": "Find reminders...",
	"reminders.addButton": "Add Reminder",
	"reminders.noPeople.title": "Add people first",
	"reminders.noPeople.description":
		"You need to add people before you can create reminders for them",
	"reminders.noPeople.addButton": "Add Person",
	"reminders.noReminders.title": "Stay connected",
	"reminders.noReminders.description":
		"Reminders help you stay connected and remember to reach out.",
	"reminders.noResults.message": 'No reminders found matching "{$query}"',
	"reminders.noResults.suggestion": "Try adjusting your search terms",
	"reminders.allCaughtUp.title": "All caught up!",
	"reminders.allCaughtUp.description":
		"Tilly will help you remember what's important",
	"reminders.done.count":
		".input {$count :number} .match $count one {{{$count} done reminder}} * {{{$count} done reminders}}",
	"reminders.done.heading": "Done ({$count :number})",
	"reminders.deleted.count":
		".input {$count :number} .match $count one {{{$count} deleted reminder}} * {{{$count} deleted reminders}}",
	"reminders.deleted.heading": "Deleted ({$count :number})",
	"reminders.created.success": "Reminder created",
	"reminders.empty.withSearch": 'No reminders found matching "{$query}"',
	"reminders.empty.noSearch": "No reminders set",
	"reminders.empty.suggestion.withSearch": "Try adjusting your search terms",
	"reminders.empty.suggestion.noSearch":
		"Reminders help you stay connected and remember to reach out.",
	"reminders.add.title": "Reminder",
	"reminders.add.description":
		"Set a reminder to follow up, check in, or remember something important about them.",

	// Individual reminder messages
	"reminder.select.title": "Select Person",
	"reminder.select.description": "Choose who this reminder is for.",
	"reminder.select.placeholder": "Select a person...",
	"reminder.select.empty": "No people found.",
	"reminder.select.search": "Search people...",
	"reminder.add.title": "Add Reminder",
	"reminder.add.description": "Set a reminder for {$person}.",
	"reminder.form.placeholder": "Set a reminder to follow up when it matters",
	"reminder.actions.title": "Reminder Actions",
	"reminder.actions.description":
		"What would you like to do with this reminder?",
	"reminder.actions.markDone": "Mark as Done",
	"reminder.actions.viewPerson": "View Person",
	"reminder.actions.addNote": "Add Note",
	"reminder.actions.delete": "Delete",
	"reminder.actions.edit": "Edit",
	"reminder.status.deleted": "Deleted",
	"reminder.status.done": "Done",
	"reminder.edit.title": "Edit Reminder",
	"reminder.edit.description": "Update the reminder details below.",
	"reminder.addNote.title": "Add Note for {$personName}",
	"reminder.addNote.description":
		"Record a note about your interaction with {$personName}.",
	"reminder.restore.title": "Restore Reminder",
	"reminder.restore.deletionInfo": "This reminder was deleted {$timeAgo}",
	"reminder.restore.permanentDeletionWarning":
		" and is due for permanent deletion.",
	"reminder.restore.permanentDeletionCountdown":
		" and will be permanently deleted in {$days :number} days.",
	"reminder.restore.question": "Would you like to restore it?",
	"reminder.restore.button": "Restore Reminder",
	"reminder.restore.permanentDelete": "Permanently Delete",
	"reminder.permanentDelete.title": "Permanently Delete Reminder",
	"reminder.permanentDelete.confirmation":
		"Are you sure you want to permanently delete this reminder? This action cannot be undone.",
	"reminder.permanentDelete.cancel": "Cancel",
	"reminder.permanentDelete.confirm": "Permanently Delete",
	"reminder.done.actions.title": "Done Reminder Actions",
	"reminder.done.actions.description":
		"What would you like to do with this completed reminder?",
	"reminder.done.markUndone": "Mark as Undone",
	"reminder.done.delete": "Delete",
	"reminder.toast.restored": "Reminder restored",
	"reminder.toast.permanentlyDeleted": "Reminder permanently deleted",
	"reminder.toast.rescheduled": "Reminder rescheduled",
	"reminder.toast.markedDone": "Reminder marked as done",
	"reminder.toast.markedUndone": "Reminder marked as undone",
	"reminder.toast.markedDoneAgain": "Reminder marked as done again",
	"reminder.toast.restoredToPreviousDate": "Reminder restored to previous date",
	"reminder.toast.markedNotDone": "Reminder marked as not done",
	"reminder.toast.updated": "Reminder updated",
	"reminder.toast.updateUndone": "Reminder update undone",
	"reminder.toast.deleted":
		"Reminder deleted - will be permanently deleted in 30 days",
})

const deRemindersMessages = translate(baseRemindersMessages, {
	// Reminders page messages
	"reminders.title": "Erinnerungen",
	"reminders.pageTitle": "Erinnerungen - Tilly",
	"reminders.search.placeholder": "Erinnerungen finden...",
	"reminders.addButton": "Erinnerung hinzufügen",
	"reminders.noPeople.title": "Zuerst Personen hinzufügen",
	"reminders.noPeople.description":
		"Du musst Personen hinzufügen, bevor du Erinnerungen für sie erstellen kannst",
	"reminders.noPeople.addButton": "Person hinzufügen",
	"reminders.noReminders.title": "Verbunden bleiben",
	"reminders.noReminders.description":
		"Erinnerungen helfen dir, in Kontakt zu bleiben und daran zu denken, dich zu melden.",
	"reminders.noResults.message":
		'Keine passenden Erinnerungen zu "{$query}" gefunden',
	"reminders.noResults.suggestion": "Passe deine Suchbegriffe an",
	"reminders.allCaughtUp.title": "Alles erledigt!",
	"reminders.allCaughtUp.description":
		"Tilly hilft dir, an Wichtiges zu denken",
	"reminders.done.count":
		".input {$count :number} .match $count one {{{$count} erledigte Erinnerung}} * {{{$count} erledigte Erinnerungen}}",
	"reminders.done.heading": "Erledigt ({$count :number})",
	"reminders.deleted.count":
		".input {$count :number} .match $count one {{{$count} gelöschte Erinnerung}} * {{{$count} gelöschte Erinnerungen}}",
	"reminders.deleted.heading": "Gelöscht ({$count :number})",
	"reminders.created.success": "Erinnerung erstellt",
	"reminders.empty.withSearch":
		'Keine passenden Erinnerungen zu "{$query}" gefunden',
	"reminders.empty.noSearch": "Noch keine Erinnerungen",
	"reminders.empty.suggestion.withSearch": "Passe deine Suchbegriffe an",
	"reminders.empty.suggestion.noSearch":
		"Erinnerungen helfen dir, in Kontakt zu bleiben und daran zu denken, dich zu melden.",
	"reminders.add.title": "Erinnerung",
	"reminders.add.description":
		"Lege eine Erinnerung fest – zum Nachfassen, Einchecken oder um etwas Wichtiges nicht zu vergessen.",

	// Individual reminder messages
	"reminder.select.title": "Person auswählen",
	"reminder.select.description": "Wähle, für wen diese Erinnerung ist.",
	"reminder.select.placeholder": "Person auswählen...",
	"reminder.select.empty": "Keine Personen gefunden.",
	"reminder.select.search": "Personen suchen...",
	"reminder.add.title": "Erinnerung hinzufügen",
	"reminder.add.description": "Lege eine Erinnerung für {$person} fest.",
	"reminder.form.placeholder":
		"Erinnerung setzen, um nachzufassen, wenn es wichtig ist",
	"reminder.actions.title": "Aktionen zur Erinnerung",
	"reminder.actions.description": "Was möchtest du mit dieser Erinnerung tun?",
	"reminder.actions.markDone": "Als erledigt markieren",
	"reminder.actions.viewPerson": "Person ansehen",
	"reminder.actions.addNote": "Notiz hinzufügen",
	"reminder.actions.delete": "Löschen",
	"reminder.actions.edit": "Bearbeiten",
	"reminder.status.deleted": "Gelöscht",
	"reminder.status.done": "Erledigt",
	"reminder.edit.title": "Erinnerung bearbeiten",
	"reminder.edit.description": "Aktualisiere die Details der Erinnerung.",
	"reminder.addNote.title": "Notiz für {$personName} hinzufügen",
	"reminder.addNote.description":
		"Halte eine Erinnerung zu deiner Interaktion mit {$personName} fest.",
	"reminder.restore.title": "Erinnerung wiederherstellen",
	"reminder.restore.deletionInfo": "Diese Erinnerung wurde {$timeAgo} gelöscht",
	"reminder.restore.permanentDeletionWarning":
		" und steht zur endgültigen Löschung an.",
	"reminder.restore.permanentDeletionCountdown":
		" und wird in {$days :number} Tagen endgültig gelöscht.",
	"reminder.restore.question": "Möchtest du sie wiederherstellen?",
	"reminder.restore.button": "Erinnerung wiederherstellen",
	"reminder.restore.permanentDelete": "Endgültig löschen",
	"reminder.permanentDelete.title": "Erinnerung endgültig löschen",
	"reminder.permanentDelete.confirmation":
		"Bist du sicher, dass du diese Erinnerung endgültig löschen möchtest? Dies kann nicht rückgängig gemacht werden.",
	"reminder.permanentDelete.cancel": "Abbrechen",
	"reminder.permanentDelete.confirm": "Endgültig löschen",
	"reminder.done.actions.title": "Aktionen für erledigte Erinnerung",
	"reminder.done.actions.description":
		"Was möchtest du mit dieser erledigten Erinnerung tun?",
	"reminder.done.markUndone": "Als nicht erledigt markieren",
	"reminder.done.delete": "Löschen",
	"reminder.toast.restored": "Erinnerung wiederhergestellt",
	"reminder.toast.permanentlyDeleted": "Erinnerung endgültig gelöscht",
	"reminder.toast.rescheduled": "Erinnerung neu terminiert",
	"reminder.toast.markedDone": "Erinnerung als erledigt markiert",
	"reminder.toast.markedUndone": "Erinnerung als nicht erledigt markiert",
	"reminder.toast.markedDoneAgain": "Erinnerung erneut als erledigt markiert",
	"reminder.toast.restoredToPreviousDate":
		"Erinnerung auf vorheriges Datum zurückgesetzt",
	"reminder.toast.markedNotDone": "Erinnerung als nicht erledigt markiert",
	"reminder.toast.updated": "Erinnerung aktualisiert",
	"reminder.toast.updateUndone":
		"Aktualisierung der Erinnerung rückgängig gemacht",
	"reminder.toast.deleted":
		"Erinnerung gelöscht – wird in 30 Tagen endgültig gelöscht",
})
