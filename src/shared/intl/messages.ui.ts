import { messages, translate } from "@ccssmnn/intl"

export { baseUiMessages, deUiMessages }

const baseUiMessages = messages({
	// Common UI messages
	"common.cancel": "Cancel",
	"common.save": "Save",
	"common.change": "Change",
	"common.clear": "Clear",
	"common.add": "Add",
	"common.close": "Close",
	"common.undo": "Undo",

	// Authentication messages
	"auth.signIn.title": "Sync Across Devices",
	"auth.signIn.description":
		"Sign in to save your data and access from any device. Already have an account? Your data will sync automatically.",
	"auth.signIn.requiresInternet": "Requires internet connection",
	"auth.signIn.button": "Sign In",
	"auth.signUp.button": "Sign Up",
	"auth.signInRequired": "Sign In Required",
	"auth.goToSettings": "Go to Settings to sign in",
	"auth.settingsLink": "Sign in via Settings",

	// Form messages
	"reminder.form.text.label": "What shouldn't you forget?",
	"reminder.form.text.required": "Reminder text is required",
	"reminder.form.date.label": "When?",
	"reminder.form.date.required": "Due date is required",
	"reminder.form.repeat.label": "Repeat reminder",
	"reminder.form.repeatEvery.label": "Repeat every",
	"reminder.form.repeatEvery.placeholder": "1",
	"reminder.form.repeatUnit.label": "Repeat unit",
	"reminder.form.repeatUnit.placeholder": "Select unit",
	"reminder.form.repeatUnit.day": "Day(s)",
	"reminder.form.repeatUnit.week": "Week(s)",
	"reminder.form.repeatUnit.month": "Month(s)",
	"reminder.form.repeatUnit.year": "Year(s)",
	"note.form.content.label": "Note",
	"note.form.content.required": "Content is required",
	"note.form.pin.label": "Pin this note",
	"note.form.pin.description":
		"Pinned notes always appear at the top of the list",
	"form.cancel": "Cancel",
	"form.save": "Save",
	"form.saving": "Saving...",

	// Navigation messages
	"nav.people": "People",
	"nav.notes": "Notes",
	"nav.reminders": "Reminder",
	"nav.assistant": "Tilly",
	"nav.settings": "Settings",
	"nav.install": "Install",
	"nav.notifications.count.max": "9+",

	// Language messages
	"language.name.en": "🇺🇸 English",
	"language.name.de": "🇩🇪 German",

	// Error messages
	"error.title": "Something went wrong",
	"error.description":
		"If you can reproduce this, I would love to hear from you.",
	"error.feedback": "Send feedback",
	"error.showDetails": "Show error details",
	"error.copy": "Copy",
	"error.copySuccess": "Error details copied to clipboard",
	"error.copyFailure": "Failed to copy error details",
	"error.goBack": "Go back to app",
	"error.details": "Error Details:",
	"error.message": "Message:",
	"error.stackTrace": "Stack Trace:",

	// Not found messages
	"notFound.title": "Page Not Found",
	"notFound.description": "The page you're looking for doesn't exist.",
	"notFound.goBack": "Go Back",
	"notFound.goToPeople": "Go to People",

	// Toast messages
	"toast.personUpdated": "Person updated",
	"toast.personRestored": "Person restored",
	"toast.personUpdateUndone": "Person update undone",
	"toast.personDeletedScheduled":
		"Person deleted - will be permanently deleted in 30 days",
	"toast.noteUpdated": "Note updated",
	"toast.noteUpdateUndone": "Note update undone",
	"toast.notePinned": "Note pinned",
	"toast.noteUnpinned": "Note unpinned",
	"toast.noteRestored": "Note restored",
	"toast.noteDeleted": "Note permanently deleted",

	// Data import/export messages
	"data.export.noData": "There is no people data to export.",
	"data.export.success": "Data exported successfully!",
	"data.export.error": "Failed to export data",
	"data.export.button": "Export Data",
	"data.export.dialog.title": "Export Data",
	"data.export.dialog.description":
		"Download all your relationship notes and details as JSON for backup or transfer to another device.",
	"data.export.dialog.cancel": "Cancel",
	"data.export.dialog.exporting": "Exporting...",
	"data.export.dialog.download": "Download Data",
	"data.import.noFile": "Please select a file",
	"data.import.invalidFormat": "Uploaded file does not match expected format.",
	"data.import.personError": "Error processing person {$name}",
	"data.import.success.merge": "Data merged successfully!",
	"data.import.success.replace": "Data replaced successfully!",
	"data.import.button": "Import Data",
	"data.import.dialog.title": "Import Data",
	"data.import.dialog.fileLabel": "Tilly File",
	"data.import.dialog.chooseFile": "Choose File",
	"data.import.dialog.noFileSelected": "No file selected",
	"data.import.dialog.modeLabel": "Import Mode",
	"data.import.mode.merge": "Merge",
	"data.import.mode.merge.description":
		"Add new people and update existing ones",
	"data.import.mode.replace": "Replace",
	"data.import.mode.replace.description":
		"Delete all current data and import new data",
	"data.import.dialog.cancel": "Cancel",
	"data.import.dialog.importing": "Importing...",
	"data.import.dialog.import": "Import Data",

	// Splash screen messages
	"splash.title": "Tilly",
	"splash.logoAlt": "Tilly logo",

	// Markdown editor messages
	"markdown.preview": "Preview",
	"markdown.edit": "Edit",
	"markdown.bold": "Bold",
	"markdown.italic": "Italic",
	"markdown.link": "Link",
	"markdown.list": "List",
	"markdown.heading": "Heading",
	"markdown.noPreview": "Nothing to preview",
})

const deUiMessages = translate(baseUiMessages, {
	// Common UI messages
	"common.cancel": "Abbrechen",
	"common.save": "Speichern",
	"common.change": "Ändern",
	"common.clear": "Löschen",
	"common.add": "Hinzufügen",
	"common.close": "Schließen",
	"common.undo": "Rückgängig",

	// Authentication messages
	"auth.signIn.title": "Über Geräte hinweg synchronisieren",
	"auth.signIn.description":
		"Melde dich an, um deine Daten zu speichern und von jedem Gerät aus darauf zuzugreifen. Hast du bereits ein Konto? Deine Daten werden automatisch synchronisiert.",
	"auth.signIn.requiresInternet": "Benötigt Internetverbindung",
	"auth.signIn.button": "Anmelden",
	"auth.signUp.button": "Registrieren",
	"auth.signInRequired": "Anmeldung erforderlich",
	"auth.goToSettings": "Gehe zu Einstellungen zum Anmelden",
	"auth.settingsLink": "Über Einstellungen anmelden",

	// Form messages
	"reminder.form.text.label": "Was solltest du nicht vergessen?",
	"reminder.form.text.required": "Erinnerungstext ist erforderlich",
	"reminder.form.date.label": "Wann?",
	"reminder.form.date.required": "Fälligkeitsdatum ist erforderlich",
	"reminder.form.repeat.label": "Erinnerung wiederholen",
	"reminder.form.repeatEvery.label": "Wiederholen alle",
	"reminder.form.repeatEvery.placeholder": "1",
	"reminder.form.repeatUnit.label": "Einheit",
	"reminder.form.repeatUnit.placeholder": "Einheit wählen",
	"reminder.form.repeatUnit.day": "Tag(e)",
	"reminder.form.repeatUnit.week": "Woche(n)",
	"reminder.form.repeatUnit.month": "Monat(e)",
	"reminder.form.repeatUnit.year": "Jahr(e)",
	"note.form.content.label": "Notiz",
	"note.form.content.required": "Inhalt ist erforderlich",
	"note.form.pin.label": "Diese Notiz anheften",
	"note.form.pin.description":
		"Angeheftete Notizen erscheinen immer oben in der Liste",
	"form.cancel": "Abbrechen",
	"form.save": "Speichern",
	"form.saving": "Speichern...",

	// Navigation messages
	"nav.people": "Personen",
	"nav.notes": "Notizen",
	"nav.reminders": "Erinnerungen",
	"nav.assistant": "Tilly",
	"nav.settings": "Einstellungen",
	"nav.install": "Installieren",
	"nav.notifications.count.max": "9+",

	// Language messages
	"language.name.en": "🇺🇸 Englisch",
	"language.name.de": "🇩🇪 Deutsch",

	// Error messages
	"error.title": "Etwas ist schief gelaufen",
	"error.description":
		"Wenn du das reproduzieren kannst, freue ich mich über eine Nachricht.",
	"error.feedback": "Feedback senden",
	"error.showDetails": "Fehlerdetails anzeigen",
	"error.copy": "Kopieren",
	"error.copySuccess": "Fehlerdetails in die Zwischenablage kopiert",
	"error.copyFailure": "Fehlerdetails konnten nicht kopiert werden",
	"error.goBack": "Zurück zur App",
	"error.details": "Fehlerdetails:",
	"error.message": "Nachricht:",
	"error.stackTrace": "Stack-Trace:",

	// Not found messages
	"notFound.title": "Seite nicht gefunden",
	"notFound.description": "Die gesuchte Seite existiert nicht.",
	"notFound.goBack": "Zurück",
	"notFound.goToPeople": "Zu Personen",

	// Toast messages
	"toast.personUpdated": "Person aktualisiert",
	"toast.personRestored": "Person wiederhergestellt",
	"toast.personUpdateUndone": "Personen-Update rückgängig gemacht",
	"toast.personDeletedScheduled":
		"Person gelöscht – wird in 30 Tagen endgültig gelöscht",
	"toast.noteUpdated": "Notiz aktualisiert",
	"toast.noteUpdateUndone": "Notiz-Update rückgängig gemacht",
	"toast.notePinned": "Notiz angeheftet",
	"toast.noteUnpinned": "Notiz gelöst",
	"toast.noteRestored": "Notiz wiederhergestellt",
	"toast.noteDeleted": "Notiz endgültig gelöscht",

	// Data import/export messages
	"data.export.noData": "Keine Personendaten zum Exportieren vorhanden.",
	"data.export.success": "Daten erfolgreich exportiert!",
	"data.export.error": "Datenexport fehlgeschlagen",
	"data.export.button": "Daten exportieren",
	"data.export.dialog.title": "Daten exportieren",
	"data.export.dialog.description":
		"Lade alle Notizen und Details als JSON zur Sicherung oder zum Übertragen auf ein anderes Gerät herunter.",
	"data.export.dialog.cancel": "Abbrechen",
	"data.export.dialog.exporting": "Exportiere...",
	"data.export.dialog.download": "Daten herunterladen",
	"data.import.noFile": "Bitte wähle eine Datei aus",
	"data.import.invalidFormat":
		"Hochgeladene Datei entspricht nicht dem erwarteten Format.",
	"data.import.personError": "Fehler beim Verarbeiten von Person {$name}",
	"data.import.success.merge": "Daten erfolgreich zusammengeführt!",
	"data.import.success.replace": "Daten erfolgreich ersetzt!",
	"data.import.button": "Daten importieren",
	"data.import.dialog.title": "Daten importieren",
	"data.import.dialog.fileLabel": "Tilly-Datei",
	"data.import.dialog.chooseFile": "Datei auswählen",
	"data.import.dialog.noFileSelected": "Keine Datei ausgewählt",
	"data.import.dialog.modeLabel": "Importmodus",
	"data.import.mode.merge": "Zusammenführen",
	"data.import.mode.merge.description":
		"Neue Personen hinzufügen und bestehende aktualisieren",
	"data.import.mode.replace": "Ersetzen",
	"data.import.mode.replace.description":
		"Alle aktuellen Daten löschen und neue Daten importieren",
	"data.import.dialog.cancel": "Abbrechen",
	"data.import.dialog.importing": "Importiere...",
	"data.import.dialog.import": "Daten importieren",

	// Splash screen messages
	"splash.title": "Tilly",
	"splash.logoAlt": "Tilly-Logo",

	// Markdown editor messages
	"markdown.preview": "Vorschau",
	"markdown.edit": "Bearbeiten",
	"markdown.bold": "Fett",
	"markdown.italic": "Kursiv",
	"markdown.link": "Link",
	"markdown.list": "Liste",
	"markdown.heading": "Überschrift",
	"markdown.noPreview": "Nichts zum Anzeigen",
})
