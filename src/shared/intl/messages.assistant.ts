import { messages, translate } from "@ccssmnn/intl"

export { baseAssistantMessages, deAssistantMessages }

const baseAssistantMessages = messages({
	// Assistant interface messages
	"assistant.title": "Chat with Tilly",
	"assistant.pageTitle": "Chat - Tilly",
	"assistant.subscribe.title": "Unlock Tilly Agent",
	"assistant.subscribe.description":
		"Your AI assistant that reads and writes your relationship journal. Just talk about your day naturally - Tilly finds people, adds notes, and suggests reminders. Get caught up before meetings or get help writing messages.\n\nTry free for 7 days, then $6/month. Manage subscription in account settings.",
	"assistant.subscribe.settings": "Go to Account Settings",
	"assistant.subscribe.currentPlan": "Current plan: {$plan}",
	"assistant.subscribe.currentPlan.unknown": "Unknown",
	"assistant.subscribe.trialStatus": "Free trial active",
	"assistant.subscribe.loading": "Checking your subscription...",
	"assistant.chatUnavailable.title": "Chat unavailable",
	"assistant.chatUnavailable.description":
		"Tilly chat requires an internet connection. All other features work offline.",
	"assistant.emptyState":
		"Share a story, and I'll help you remember what matters",
	"assistant.generating": "Generating response...",
	"assistant.error.title": "Something went wrong",
	"assistant.responseFailure.title": "Response Issue",
	"assistant.responseFailure.emptyDescription":
		"I'm sorry, but I didn't respond properly. This sometimes happens with AI models. Please try your question again.",
	"assistant.usageLimit.title": "Usage limit reached",
	"assistant.usageLimit.description":
		"You've reached your usage limit. Check your settings to see when limits reset.",
	"assistant.usageLimit.viewSettings": "View Settings",
	"assistant.clearChat": "Clear Chat",
	"assistant.placeholder.disabled": "Chat requires internet connection",
	"assistant.placeholder.initial": "Chat with Tilly",
	"assistant.placeholder.reply": "Reply to Tilly...",
	"assistant.speak": "Speak",
	"assistant.listening": "Listening...",

	// Speech recognition
	"assistant.speech.start": "Start voice input",
	"assistant.speech.stop": "Stop voice input",

	// Speech recognition errors
	"assistant.speech.error.permission":
		"Microphone permission denied. Please allow microphone access.",
	"assistant.speech.error.network":
		"Network error. Please check your connection.",
	"assistant.speech.error.noSpeech": "No speech detected. Please try again.",
	"assistant.speech.error.audioCapture":
		"Could not access microphone. Please check your device settings.",
	"assistant.speech.error.generic":
		"Speech recognition error. Please try again.",

	// Tool-related messages
	"tool.cancel": "Cancel",
	"tool.create": "Create",
	"tool.undo": "Undo",
	"tool.viewPerson": "View Person",
	"tool.viewNotes": "View Notes",
	"tool.viewReminders": "View Reminders",
	"tool.restore": "Restore",
	"tool.undone": "(undone)",
	"tool.pinned": "📌 Pinned",
	"tool.error.failedToCreate": "Failed to create person",
	"tool.error.unknown": "Unknown error",
	"tool.error.failedToUndo": "❌ Failed to undo: {$error}",
	"tool.person.createConfirm.title": "Create new Person {$name}?",
	"tool.person.createConfirm.description":
		"Tilly want's to create a new Person.",
	"tool.person.createCancel.reason": "User chose not to create this person",
	"tool.person.created.message": "Created person: {$name}",
	"tool.person.created.undone": 'Created person "{$name}" (undone)',
	"tool.person.created.dialog.title": "Person Created",
	"tool.person.created.dialog.description":
		"Details of the person that was created.",
	"tool.person.created.dialog.section": "Person",
	"tool.person.created.undo.success": '✅ Undo: Deleted person "{$name}"',
	"tool.person.updated.message": "Updated person: {$name}",
	"tool.person.updated.undone": 'Updated person "{$name}" (undone)',
	"tool.person.updated.dialog.title": "Person Updated",
	"tool.person.updated.dialog.description":
		"Before and after comparison of the person changes.",
	"tool.person.updated.dialog.current": "Current",
	"tool.person.updated.dialog.previous": "Previous",
	"tool.person.updated.undo.success":
		'✅ Undo: Restored person update for "{$name}"',
	"tool.person.deleted.message": "Deleted person: {$name}",
	"tool.person.deleted.undone": 'Deleted person "{$name}" (undone)',
	"tool.person.deleted.dialog.title": "Person Deleted",
	"tool.person.deleted.dialog.description": "Details of the deleted person.",
	"tool.person.deleted.dialog.section": "Deleted Person",
	"tool.person.deleted.undo.success": '✅ Undo: Restored person "{$name}"',
	"tool.people.found.count":
		".input {$count :number} .match $count one {{Found {$count} person}} * {{Found {$count} people}}",
	"tool.people.found.withQuery":
		'.input {$count :number} .match $count one {{Found {$count} person matching "{$query}"}} * {{Found {$count} people matching "{$query}"}}',
	"tool.people.dialog.title": "People Found",
	"tool.people.dialog.description":
		"Search results for people in your contacts.",
	"tool.people.dialog.results": "Results",
	"tool.people.viewSearchResults": "View Search Results",
	"tool.person.read.message":
		"Read Person {$name} ({$notesCount :number} notes) ({$remindersCount :number} reminders)",
	"tool.person.read.dialog.title": "Person Details",
	"tool.person.read.dialog.description": "Information found for this person.",
	"tool.person.read.dialog.section": "Person",
	"tool.person.read.dialog.notesCount":
		".input {$count :number} .match $count one {{{$count} note}} * {{{$count} notes}}",
	"tool.person.read.dialog.remindersCount":
		".input {$count :number} .match $count one {{{$count} reminder}} * {{{$count} reminders}}",
	"tool.note.created.message": "Added note: {$content}",
	"tool.note.created.undone": "Added note (undone)",
	"tool.note.created.dialog.title": "Note Added",
	"tool.note.created.dialog.description":
		"Details of the note that was created.",
	"tool.note.created.dialog.section": "Note",
	"tool.note.created.undo.success": "✅ Undo: Deleted note",
	"tool.note.pinned": "📌 Pinned",
	"tool.note.updated.message": "Updated note: {$content}",
	"tool.note.updated.undone": "Updated note (undone)",
	"tool.note.updated.dialog.title": "Note Updated",
	"tool.note.updated.dialog.description":
		"Before and after comparison of the note changes.",
	"tool.note.updated.dialog.current": "Current",
	"tool.note.updated.dialog.previous": "Previous",
	"tool.note.updated.undo.success": "✅ Undo: Restored note",
	"tool.note.deleted.message": "Deleted note: {$content}",
	"tool.note.deleted.undone": "Deleted note (undone)",
	"tool.note.deleted.dialog.title": "Note Deleted",
	"tool.note.deleted.dialog.description":
		"Details of the note that was deleted.",
	"tool.note.deleted.dialog.section": "Deleted Note",
	"tool.note.deleted.undo.success": "✅ Undo: Restored note",
	"tool.reminder.created.message": "Added reminder: {$text}",
	"tool.reminder.created.undone": "Added reminder {$text} (undone)",
	"tool.reminder.created.dialog.title": "Reminder Added",
	"tool.reminder.created.dialog.description":
		"Details of the reminder that was created.",
	"tool.reminder.created.dialog.section": "Reminder",
	"tool.reminder.created.undo.success": '✅ Undo: Deleted reminder "{$text}"',
	"tool.reminder.noDate": "No date",
	"tool.reminder.repeats": "Repeats every {$interval :number} {$unit}(s)",
	"tool.reminder.done": "Done",
	"tool.reminder.notDone": "Not done",
	"tool.reminder.updated.message": "Updated reminder",
	"tool.reminder.updated.undone": "Updated reminder (undone)",
	"tool.reminder.updated.dialog.title": "Reminder Updated",
	"tool.reminder.updated.dialog.description":
		"Before and after comparison of the reminder changes.",
	"tool.reminder.updated.dialog.current": "Current",
	"tool.reminder.updated.dialog.previous": "Previous",
	"tool.reminder.updated.undo.success": "✅ Undo: Restored reminder",
	"tool.reminder.deleted.message": "Removed reminder",
	"tool.reminder.deleted.undone": "Removed reminder (undone)",
	"tool.reminder.deleted.dialog.title": "Reminder Removed",
	"tool.reminder.deleted.dialog.description":
		"Details of the reminder that was removed.",
	"tool.reminder.deleted.dialog.section": "Removed Reminder",
	"tool.reminder.deleted.undo.success": "✅ Undo: Restored reminder",
	"tool.reminder.list.message.none": "No reminders found",
	"tool.reminder.list.message.count":
		".input {$count :number} .match $count one {{Found {$count} reminder}} * {{Found {$count} reminders}}",
	"tool.reminder.list.dialog.title": "Reminders",
	"tool.reminder.list.dialog.description": "Your upcoming reminders.",
	"tool.reminder.list.empty.noDue": "No reminders are due right now.",
	"tool.reminder.list.empty.noMatch": "No reminders match your search.",
	"tool.reminder.list.empty.noActive": "No active reminders found.",
	"tool.reminder.list.showingFirst": "Showing first {$count :number} reminders",
	"tool.reminder.list.person": "For: {$name}",
	"tool.reminder.list.andMore":
		".input {$count :number} .match $count one {{and {$count} more reminder}} * {{and {$count} more reminders}}",
	"tool.userQuestion.selectOption": "Please select an option",
	"tool.userQuestion.selectPlaceholder": "Select an option...",
	"tool.userQuestion.failedToProcess": "Failed to process answer",
	"tool.userQuestion.cancelled": "User cancelled the question",
	"tool.userQuestion.yes": "Yes",
	"tool.userQuestion.no": "No",
	"tool.userQuestion.cancel": "Cancel",
	"tool.userQuestion.submit": "Submit",

	// Voice recording messages
	"assistant.voiceRecording.title": "Voice Message",
	"assistant.voiceRecording.recording": "Recording...",
	"assistant.voiceRecording.maxDuration": "Maximum 10 minutes",
	"assistant.voiceRecording.send": "Send Message",
	"assistant.voiceRecording.start": "Start Recording",
	"assistant.voiceRecording.stop": "Stop Recording",
	"assistant.voiceRecording.continue": "Continue",
	"assistant.voiceRecording.restart": "Restart",
	"assistant.voiceRecording.play": "Play",
	"assistant.voiceRecording.pause": "Pause",

	// New message dialog
	"assistant.newMessage.title": "New Message",
	"assistant.newMessage.placeholder": "Type your message...",
	"assistant.newMessage.voiceButton": "Voice",
	"assistant.newMessage.send": "Send",

	// Action messages (general actions)
	"action.undo": "Undo",
})

const deAssistantMessages = translate(baseAssistantMessages, {
	// Assistant interface messages
	"assistant.title": "Mit Tilly chatten",
	"assistant.pageTitle": "Chat - Tilly",
	"assistant.subscribe.title": "Tilly-Agent freischalten",
	"assistant.subscribe.description":
		"Dein KI-Assistent, der dein Beziehungstagebuch liest und schreibt. Erzähle einfach natürlich von deinem Tag - Tilly findet Personen, fügt Notizen hinzu und schlägt Erinnerungen vor. Lass dich vor Treffen auf den neuesten Stand bringen oder erhalte Hilfe beim Nachrichtenschreiben.\n\n7 Tage kostenlos testen, dann 6€/Monat. Abonnement in den Kontoeinstellungen verwalten.",
	"assistant.subscribe.settings": "Zu den Kontoeinstellungen",
	"assistant.subscribe.currentPlan": "Aktueller Tarif: {$plan}",
	"assistant.subscribe.currentPlan.unknown": "Unbekannt",
	"assistant.subscribe.trialStatus": "Kostenlose Testphase aktiv",
	"assistant.subscribe.loading": "Abonnement wird geprüft...",
	"assistant.chatUnavailable.title": "Chat nicht verfügbar",
	"assistant.chatUnavailable.description":
		"Der Tilly-Chat benötigt eine Internetverbindung. Alle anderen Funktionen funktionieren offline.",
	"assistant.emptyState":
		"Erzähle eine Geschichte – ich helfe dir, das Wichtige zu behalten",
	"assistant.generating": "Antwort wird erstellt...",
	"assistant.error.title": "Etwas ist schief gelaufen",
	"assistant.responseFailure.title": "Antwortproblem",
	"assistant.responseFailure.emptyDescription":
		"Entschuldigung, aber ich habe nicht richtig geantwortet. Das passiert manchmal bei KI-Modellen. Bitte versuche deine Frage nochmal.",
	"assistant.usageLimit.title": "Nutzungsgrenze erreicht",
	"assistant.usageLimit.description":
		"Du hast deine Nutzungsgrenze erreicht. Schaue in den Einstellungen wann die Grenzen zurückgesetzt werden.",
	"assistant.usageLimit.viewSettings": "Einstellungen ansehen",
	"assistant.clearChat": "Chat leeren",
	"assistant.placeholder.disabled": "Chat erfordert Internetverbindung",
	"assistant.placeholder.initial": "Mit Tilly chatten",
	"assistant.placeholder.reply": "Tilly antworten...",
	"assistant.speak": "Sprechen",
	"assistant.listening": "Höre zu...",

	// Speech recognition
	"assistant.speech.start": "Spracheingabe starten",
	"assistant.speech.stop": "Spracheingabe stoppen",

	// Speech recognition errors
	"assistant.speech.error.permission":
		"Mikrofonberechtigung verweigert. Bitte erlaube den Mikrofonzugriff.",
	"assistant.speech.error.network":
		"Netzwerkfehler. Bitte überprüfe deine Verbindung.",
	"assistant.speech.error.noSpeech":
		"Keine Sprache erkannt. Bitte versuche es erneut.",
	"assistant.speech.error.audioCapture":
		"Kein Zugriff auf Mikrofon möglich. Bitte überprüfe deine Geräteeinstellungen.",
	"assistant.speech.error.generic":
		"Fehler bei der Spracherkennung. Bitte versuche es erneut.",

	// Tool-related messages
	"tool.cancel": "Abbrechen",
	"tool.create": "Erstellen",
	"tool.undo": "Rückgängig",
	"tool.viewPerson": "Person ansehen",
	"tool.viewNotes": "Notizen ansehen",
	"tool.viewReminders": "Erinnerungen ansehen",
	"tool.restore": "Wiederherstellen",
	"tool.undone": "(rückgängig gemacht)",
	"tool.pinned": "📌 Angeheftet",
	"tool.error.failedToCreate": "Person konnte nicht erstellt werden",
	"tool.error.unknown": "Unbekannter Fehler",
	"tool.error.failedToUndo": "❌ Rückgängig machen fehlgeschlagen: {$error}",
	"tool.person.createConfirm.title": "Neue Person {$name} erstellen?",
	"tool.person.createConfirm.description":
		"Tilly möchte eine neue Person erstellen.",
	"tool.person.createCancel.reason":
		"Nutzer hat sich gegen das Erstellen entschieden",
	"tool.person.created.message": "Person erstellt: {$name}",
	"tool.person.created.undone":
		'Person "{$name}" erstellt (rückgängig gemacht)',
	"tool.person.created.dialog.title": "Person erstellt",
	"tool.person.created.dialog.description": "Details zur erstellten Person.",
	"tool.person.created.dialog.section": "Person",
	"tool.person.created.undo.success":
		'✅ Rückgängig: Person "{$name}" gelöscht',
	"tool.person.updated.message": "Person aktualisiert: {$name}",
	"tool.person.updated.undone":
		'Person "{$name}" aktualisiert (rückgängig gemacht)',
	"tool.person.updated.dialog.title": "Person aktualisiert",
	"tool.person.updated.dialog.description":
		"Vorher-Nachher-Vergleich der Änderungen.",
	"tool.person.updated.dialog.current": "Aktuell",
	"tool.person.updated.dialog.previous": "Vorher",
	"tool.person.updated.undo.success":
		'✅ Rückgängig: Update für "{$name}" wiederhergestellt',
	"tool.person.deleted.message": "Person gelöscht: {$name}",
	"tool.person.deleted.undone":
		'Person "{$name}" gelöscht (rückgängig gemacht)',
	"tool.person.deleted.dialog.title": "Person gelöscht",
	"tool.person.deleted.dialog.description": "Details zur gelöschten Person.",
	"tool.person.deleted.dialog.section": "Gelöschte Person",
	"tool.person.deleted.undo.success":
		'✅ Rückgängig: Person "{$name}" wiederhergestellt',
	"tool.people.found.count":
		".input {$count :number} .match $count one {{{$count} Person gefunden}} * {{{$count} Personen gefunden}}",
	"tool.people.found.withQuery":
		'.input {$count :number} .match $count one {{{$count} Person zu "{$query}" gefunden}} * {{{$count} Personen zu "{$query}" gefunden}}',
	"tool.people.dialog.title": "Personen gefunden",
	"tool.people.dialog.description":
		"Suchergebnisse für Personen in deinen Kontakten.",
	"tool.people.dialog.results": "Ergebnisse",
	"tool.people.viewSearchResults": "Suchergebnisse anzeigen",
	"tool.person.read.message":
		"Person {$name} gelesen ({$notesCount :number} Notizen) ({$remindersCount :number} Erinnerungen)",
	"tool.person.read.dialog.title": "Personendetails",
	"tool.person.read.dialog.description":
		"Gefundene Informationen zu dieser Person.",
	"tool.person.read.dialog.section": "Person",
	"tool.person.read.dialog.notesCount":
		".input {$count :number} .match $count one {{{$count} Notiz}} * {{{$count} Notizen}}",
	"tool.person.read.dialog.remindersCount":
		".input {$count :number} .match $count one {{{$count} Erinnerung}} * {{{$count} Erinnerungen}}",
	"tool.note.created.message": "Notiz hinzugefügt: {$content}",
	"tool.note.created.undone": "Notiz hinzugefügt (rückgängig gemacht)",
	"tool.note.created.dialog.title": "Notiz hinzugefügt",
	"tool.note.created.dialog.description": "Details zur erstellten Notiz.",
	"tool.note.created.dialog.section": "Notiz",
	"tool.note.created.undo.success": "✅ Rückgängig: Notiz gelöscht",
	"tool.note.pinned": "📌 Angeheftet",
	"tool.note.updated.message": "Notiz aktualisiert: {$content}",
	"tool.note.updated.undone": "Notiz aktualisiert (rückgängig gemacht)",
	"tool.note.updated.dialog.title": "Notiz aktualisiert",
	"tool.note.updated.dialog.description":
		"Vorher-Nachher-Vergleich der Änderungen.",
	"tool.note.updated.dialog.current": "Aktuell",
	"tool.note.updated.dialog.previous": "Vorher",
	"tool.note.updated.undo.success": "✅ Rückgängig: Notiz wiederhergestellt",
	"tool.note.deleted.message": "Notiz gelöscht: {$content}",
	"tool.note.deleted.undone": "Notiz gelöscht (rückgängig gemacht)",
	"tool.note.deleted.dialog.title": "Notiz gelöscht",
	"tool.note.deleted.dialog.description": "Details zur gelöschten Notiz.",
	"tool.note.deleted.dialog.section": "Gelöschte Notiz",
	"tool.note.deleted.undo.success": "✅ Rückgängig: Notiz wiederhergestellt",
	"tool.reminder.created.message": "Erinnerung hinzugefügt: {$text}",
	"tool.reminder.created.undone":
		"Erinnerung {$text} hinzugefügt (rückgängig gemacht)",
	"tool.reminder.created.dialog.title": "Erinnerung hinzugefügt",
	"tool.reminder.created.dialog.description":
		"Details zur erstellten Erinnerung.",
	"tool.reminder.created.dialog.section": "Erinnerung",
	"tool.reminder.created.undo.success":
		'✅ Rückgängig: Erinnerung "{$text}" gelöscht',
	"tool.reminder.noDate": "Kein Datum",
	"tool.reminder.repeats":
		"Wiederholt sich alle {$interval :number} {$unit}(e)",
	"tool.reminder.done": "Erledigt",
	"tool.reminder.notDone": "Nicht erledigt",
	"tool.reminder.updated.message": "Erinnerung aktualisiert",
	"tool.reminder.updated.undone":
		"Erinnerung aktualisiert (rückgängig gemacht)",
	"tool.reminder.updated.dialog.title": "Erinnerung aktualisiert",
	"tool.reminder.updated.dialog.description":
		"Vorher-Nachher-Vergleich der Änderungen.",
	"tool.reminder.updated.dialog.current": "Aktuell",
	"tool.reminder.updated.dialog.previous": "Vorher",
	"tool.reminder.updated.undo.success":
		"✅ Rückgängig: Erinnerung wiederhergestellt",
	"tool.reminder.deleted.message": "Erinnerung entfernt",
	"tool.reminder.deleted.undone": "Erinnerung entfernt (rückgängig gemacht)",
	"tool.reminder.deleted.dialog.title": "Erinnerung entfernt",
	"tool.reminder.deleted.dialog.description":
		"Details zur entfernten Erinnerung.",
	"tool.reminder.deleted.dialog.section": "Entfernte Erinnerung",
	"tool.reminder.deleted.undo.success":
		"✅ Rückgängig: Erinnerung wiederhergestellt",
	"tool.reminder.list.message.none": "Keine Erinnerungen gefunden",
	"tool.reminder.list.message.count":
		".input {$count :number} .match $count one {{Gefunden: {$count} Erinnerung}} * {{Gefunden: {$count} Erinnerungen}}",
	"tool.reminder.list.dialog.title": "Erinnerungen",
	"tool.reminder.list.dialog.description": "Deine bevorstehenden Erinnerungen.",
	"tool.reminder.list.empty.noDue": "Derzeit sind keine Erinnerungen fällig.",
	"tool.reminder.list.empty.noMatch":
		"Keine Erinnerungen entsprechen deiner Suche.",
	"tool.reminder.list.empty.noActive": "Keine aktiven Erinnerungen gefunden.",
	"tool.reminder.list.showingFirst":
		"Zeige die ersten {$count :number} Erinnerungen",
	"tool.reminder.list.person": "Für: {$name}",
	"tool.reminder.list.andMore":
		".input {$count :number} .match $count one {{und {$count} weitere Erinnerung}} * {{und {$count} weitere Erinnerungen}}",
	"tool.userQuestion.selectOption": "Bitte wähle eine Option",
	"tool.userQuestion.selectPlaceholder": "Option auswählen...",
	"tool.userQuestion.failedToProcess":
		"Antwort konnte nicht verarbeitet werden",
	"tool.userQuestion.cancelled": "Benutzer hat die Frage abgebrochen",
	"tool.userQuestion.yes": "Ja",
	"tool.userQuestion.no": "Nein",
	"tool.userQuestion.cancel": "Abbrechen",
	"tool.userQuestion.submit": "Senden",

	// Voice recording messages
	"assistant.voiceRecording.title": "Sprachnachricht",
	"assistant.voiceRecording.recording": "Aufnahme läuft...",
	"assistant.voiceRecording.maxDuration": "Maximal 10 Minuten",
	"assistant.voiceRecording.send": "Nachricht senden",
	"assistant.voiceRecording.start": "Aufnahme starten",
	"assistant.voiceRecording.stop": "Aufnahme stoppen",
	"assistant.voiceRecording.continue": "Fortsetzen",
	"assistant.voiceRecording.restart": "Neu starten",
	"assistant.voiceRecording.play": "Abspielen",
	"assistant.voiceRecording.pause": "Pausieren",

	// New message dialog
	"assistant.newMessage.title": "Neue Nachricht",
	"assistant.newMessage.placeholder": "Schreibe deine Nachricht...",
	"assistant.newMessage.voiceButton": "Sprache",
	"assistant.newMessage.send": "Senden",

	// Action messages (general actions)
	"action.undo": "Rückgängig",
})
