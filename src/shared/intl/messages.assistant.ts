import { messages, translate } from "@ccssmnn/intl"

export { baseAssistantMessages, deAssistantMessages }

const baseAssistantMessages = messages({
	// Assistant interface messages
	"assistant.title": "Chat with Tilly",
	"assistant.pageTitle": "Chat",
	"assistant.subscribe.title": "Get AI Assistance with Tilly Plus",
	"assistant.subscribe.description":
		"Tilly Agent can turn your thoughts into notes and reminders. It's like talking to your journal! Try free for 30 days.",
	"assistant.subscribe.settings": "Start Free Trial",
	"assistant.signedOut.title": "Sign in to use Tilly AI",
	"assistant.signedOut.description":
		"Tilly AI needs an account to access your contacts, notes, and reminders.",
	"assistant.subscribe.currentPlan": "Current plan: {$plan}",
	"assistant.subscribe.currentPlan.unknown": "Unknown",
	"assistant.subscribe.trialStatus": "Free trial active",
	"assistant.subscribe.loading": "Checking your subscription...",
	"assistant.chatUnavailable.title": "Chat unavailable",
	"assistant.chatUnavailable.description":
		"Tilly chat requires an internet connection. All other features work offline.",
	"assistant.emptyState":
		"Share a story, and I'll help you remember what matters",
	"assistant.emptyState.welcome": "Hi, I'm Tilly",
	"assistant.emptyState.description":
		"I help you turn conversations into notes and reminders. Share a story, thought, or just chat!",
	"assistant.emptyState.starter.note":
		"I've had a call with {$name} today. {$name} told me about...",
	"assistant.emptyState.starter.reminder":
		"Remind me next week to ask {$name} about...",
	"assistant.emptyState.starter.followUp.single":
		"Suggest a text for my reminder for {$name}.",
	"assistant.emptyState.starter.followUp.multiple":
		"Suggest a text for each due reminder today.",
	"assistant.emptyState.starter.followUp.none":
		"What should I follow up with {$name} about?",
	"assistant.emptyState.starter.person": "Add a new person to your journal",
	"assistant.emptyState.starter.talkAbout": "What do you know about {$name}?",
	"assistant.sending": "Sending to server...",
	"assistant.generating": "Generating response...",
	"assistant.generatingOnOtherDevice": "Generating response on other device...",
	"assistant.error.title": "Something went wrong",
	"assistant.sendError.title": "Failed to send message",
	"assistant.backgroundError.title": "Generation failed",
	"assistant.responseFailure.title": "Response Issue",
	"assistant.responseFailure.emptyDescription":
		"I'm sorry, but I didn't respond properly. This sometimes happens with AI models. Please try your question again.",
	"assistant.emptyMessages.description":
		"No messages to process. Start a conversation first.",
	"assistant.requestTooLarge.title": "Message too long",
	"assistant.requestTooLarge.description":
		"Your message exceeds the size limit. Try a shorter message or clear the chat to start fresh.",
	"assistant.workerTimeout.title": "Sync timeout",
	"assistant.workerTimeout.description":
		"Couldn't sync your data in time. Please try again.",
	"assistant.usageLimit.title": "Usage limit reached",
	"assistant.usageLimit.description":
		"You've reached your usage limit. Check your settings to see when limits reset.",
	"assistant.usageLimit.viewSettings": "View Settings",
	"assistant.clearChat": "Clear Chat",
	"assistant.clearChatHint.title": "Save usage with fresh conversations",
	"assistant.clearChatHint.description":
		"Starting a new conversation helps save your usage budget. Clear your chat to begin fresh.",
	"assistant.clearChatHint.dismiss": "Got it",
	"assistant.input.hint": "Press Cmd, Ctrl, or Shift plus Enter to send.",
	"assistant.input.send": "Send message",
	"assistant.input.stopGenerating": "Stop response generation",
	"assistant.placeholder.offline": "Chat requires internet connection",
	"assistant.placeholder.generating": "Generating response...",
	"assistant.placeholder.initial": "Chat with Tilly",
	"assistant.placeholder.reply": "Reply to Tilly...",

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
	"tool.note.list.message.none": "No notes found",
	"tool.note.list.message.count":
		".input {$count :number} .match $count one {{Found {$count} note}} * {{Found {$count} notes}}",
	"tool.note.list.message.withQuery":
		'.input {$count :number} .match $count one {{Found {$count} note matching "{$query}"}} * {{Found {$count} notes matching "{$query}"}}',
	"tool.note.list.dialog.title": "Notes",
	"tool.note.list.dialog.description": "Notes across all people.",
	"tool.note.list.empty.noNotes": "No notes available yet.",
	"tool.note.list.empty.noMatch": "No notes match your search.",
	"tool.note.list.dialog.results": "Results",
	"tool.note.list.results.count":
		".input {$count :number} .match $count one {{Showing {$count} note}} * {{Showing {$count} notes}}",
	"tool.note.list.results.withQuery":
		'.input {$count :number} .match $count one {{Showing {$count} note matching "{$query}"}} * {{Showing {$count} notes matching "{$query}"}}',
	"tool.note.list.preview.more":
		".input {$count :number} .match $count one {{and {$count} more note}} * {{and {$count} more notes}}",
	"tool.note.list.tag.deleted": "Deleted",
	"tool.note.list.viewNotes": "View Notes",
	"tool.note.list.viewSearchResults": "View Search Results",
	"tool.reminder.created.message": "Added reminder: {$text}",
	"tool.reminder.created.undone": "Added reminder {$text} (undone)",
	"tool.reminder.created.dialog.title": "Reminder Added",
	"tool.reminder.created.dialog.description":
		"Details of the reminder that was created.",
	"tool.reminder.created.dialog.section": "Reminder",
	"tool.reminder.created.undo.success": '✅ Undo: Deleted reminder "{$text}"',
	"tool.reminder.noDate": "No date",
	"tool.reminder.repeats":
		".input {$unit :string} .match $unit day {{Repeats every {$interval :number} day(s)}} week {{Repeats every {$interval :number} week(s)}} month {{Repeats every {$interval :number} month(s)}} year {{Repeats every {$interval :number} year(s)}} * {{Repeats every {$interval :number} {$unit}}}",
	"tool.reminder.done": "Done",
	"tool.reminder.notDone": "Not done",
	"tool.reminder.updated.message": "Updated reminder: {$text}",
	"tool.reminder.updated.undone": "Updated reminder {$text} (undone)",
	"tool.reminder.updated.dialog.title": "Reminder Updated",
	"tool.reminder.updated.dialog.description":
		"Before and after comparison of the reminder changes.",
	"tool.reminder.updated.dialog.current": "Current",
	"tool.reminder.updated.dialog.previous": "Previous",
	"tool.reminder.updated.undo.success": "✅ Undo: Restored reminder",
	"tool.reminder.deleted.message": "Removed reminder: {$text}",
	"tool.reminder.deleted.undone": "Removed reminder {$text} (undone)",
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
	"tool.userQuestion.title": "Question",
	"tool.userQuestion.result.questionLabel": "Q:",
	"tool.userQuestion.result.answerLabel": "A:",

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
	"assistant.pageTitle": "Chat",
	"assistant.subscribe.title": "Erhalte KI Unterstützung mit Tilly Plus",
	"assistant.subscribe.description":
		"Der Tilly Agent verwandelt lose Gedanken in Notizen und Erinnerungen. Als würdest du mit deinem Journal Sprechen. 30 Tage kostenlos testen.",
	"assistant.subscribe.settings": "Kostenlos testen",
	"assistant.signedOut.title": "Melde dich an, um Tilly KI zu nutzen",
	"assistant.signedOut.description":
		"Die Tilly KI benötigt ein Konto, um auf Kontakte, Notizen und Erinnerungen zuzugreifen.",
	"assistant.subscribe.currentPlan": "Aktueller Tarif: {$plan}",
	"assistant.subscribe.currentPlan.unknown": "Unbekannt",
	"assistant.subscribe.trialStatus": "Kostenlose Testphase aktiv",
	"assistant.subscribe.loading": "Abonnement wird geprüft...",
	"assistant.chatUnavailable.title": "Chat nicht verfügbar",
	"assistant.chatUnavailable.description":
		"Der Tilly-Chat benötigt eine Internetverbindung. Alle anderen Funktionen funktionieren offline.",
	"assistant.emptyState":
		"Erzähle eine Geschichte – ich helfe dir, das Wichtige zu behalten",
	"assistant.emptyState.welcome": "Hi, ich bin Tilly",
	"assistant.emptyState.description":
		"Ich helfe dir, Gespräche in Notizen und Erinnerungen zu verwandeln. Erzähl mir eine Geschichte, einen Gedanken, oder chatte einfach!",
	"assistant.emptyState.starter.note":
		"Ich hatte heute ein Gespräch mit {$name}. {$name} erzählte mir von...",
	"assistant.emptyState.starter.reminder":
		"Erinnere mich nächste Woche daran, {$name} zu fragen nach...",
	"assistant.emptyState.starter.followUp.single":
		"Schlage einen Text für meine Erinnerung für {$name} vor.",
	"assistant.emptyState.starter.followUp.multiple":
		"Schlage einen Text für jede fällige Erinnerung heute vor.",
	"assistant.emptyState.starter.followUp.none":
		"Wobei sollte ich mich bei {$name} melden?",
	"assistant.emptyState.starter.person":
		"Füge eine neue Person zu deinem Journal hinzu",
	"assistant.emptyState.starter.talkAbout": "Was weißt du über {$name}?",
	"assistant.sending": "Wird an Server gesendet...",
	"assistant.generating": "Antwort wird erstellt...",
	"assistant.generatingOnOtherDevice":
		"Antwort wird auf anderem Gerät erstellt...",
	"assistant.error.title": "Etwas ist schief gelaufen",
	"assistant.sendError.title": "Nachricht konnte nicht gesendet werden",
	"assistant.backgroundError.title": "Generierung fehlgeschlagen",
	"assistant.responseFailure.title": "Antwortproblem",
	"assistant.responseFailure.emptyDescription":
		"Entschuldigung, aber ich habe nicht richtig geantwortet. Das passiert manchmal bei KI-Modellen. Bitte versuche deine Frage nochmal.",
	"assistant.emptyMessages.description":
		"Keine Nachrichten zu verarbeiten. Starte zuerst ein Gespräch.",
	"assistant.requestTooLarge.title": "Nachricht zu lang",
	"assistant.requestTooLarge.description":
		"Deine Nachricht überschreitet das Größenlimit. Versuche eine kürzere Nachricht oder leere den Chat für einen Neustart.",
	"assistant.workerTimeout.title": "Sync-Timeout",
	"assistant.workerTimeout.description":
		"Daten konnten nicht rechtzeitig synchronisiert werden. Bitte versuche es erneut.",
	"assistant.usageLimit.title": "Nutzungsgrenze erreicht",
	"assistant.usageLimit.description":
		"Du hast deine Nutzungsgrenze erreicht. Schaue in den Einstellungen wann die Grenzen zurückgesetzt werden.",
	"assistant.usageLimit.viewSettings": "Einstellungen ansehen",
	"assistant.clearChat": "Chat leeren",
	"assistant.clearChatHint.title": "Nutzung mit neuen Gesprächen sparen",
	"assistant.clearChatHint.description":
		"Ein neues Gespräch zu beginnen hilft, dein Nutzungsbudget zu sparen. Lösche deinen Chat für einen frischen Start.",
	"assistant.clearChatHint.dismiss": "Alles klar",
	"assistant.input.hint":
		"Drücke Cmd, Ctrl oder Shift zusammen mit Enter, um zu senden.",
	"assistant.input.send": "Nachricht senden",
	"assistant.input.stopGenerating": "Antwortgenerierung stoppen",
	"assistant.placeholder.offline": "Chat erfordert Internetverbindung",
	"assistant.placeholder.generating": "Antwort wird erstellt...",
	"assistant.placeholder.initial": "Mit Tilly chatten",
	"assistant.placeholder.reply": "Tilly antworten...",

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
	"tool.note.list.message.none": "Keine Notizen gefunden",
	"tool.note.list.message.count":
		".input {$count :number} .match $count one {{Gefunden {$count} Notiz}} * {{Gefunden {$count} Notizen}}",
	"tool.note.list.message.withQuery":
		'.input {$count :number} .match $count one {{Gefunden {$count} Notiz zu "{$query}"}} * {{Gefunden {$count} Notizen zu "{$query}"}}',
	"tool.note.list.dialog.title": "Notizen",
	"tool.note.list.dialog.description": "Notizen über alle Personen hinweg.",
	"tool.note.list.empty.noNotes": "Noch keine Notizen verfügbar.",
	"tool.note.list.empty.noMatch": "Keine Notizen entsprechen deiner Suche.",
	"tool.note.list.dialog.results": "Ergebnisse",
	"tool.note.list.results.count":
		".input {$count :number} .match $count one {{Zeige {$count} Notiz}} * {{Zeige {$count} Notizen}}",
	"tool.note.list.results.withQuery":
		'.input {$count :number} .match $count one {{Zeige {$count} Notiz zu "{$query}"}} * {{Zeige {$count} Notizen zu "{$query}"}}',
	"tool.note.list.preview.more":
		".input {$count :number} .match $count one {{und {$count} weitere Notiz}} * {{und {$count} weitere Notizen}}",
	"tool.note.list.viewNotes": "Notizen ansehen",
	"tool.note.list.viewSearchResults": "Suchergebnisse anzeigen",
	"tool.note.list.tag.deleted": "Gelöscht",
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
		".input {$unit :string} .match $unit day {{Wiederholt sich alle {$interval :number} Tag(e)}} week {{Wiederholt sich alle {$interval :number} Woche(n)}} month {{Wiederholt sich alle {$interval :number} Monat(e)}} year {{Wiederholt sich alle {$interval :number} Jahr(e)}} * {{Wiederholt sich alle {$interval :number} {$unit}}}",
	"tool.reminder.done": "Erledigt",
	"tool.reminder.notDone": "Nicht erledigt",
	"tool.reminder.updated.message": "Erinnerung aktualisiert: {$text}",
	"tool.reminder.updated.undone":
		"Erinnerung {$text} aktualisiert (rückgängig gemacht)",
	"tool.reminder.updated.dialog.title": "Erinnerung aktualisiert",
	"tool.reminder.updated.dialog.description":
		"Vorher-Nachher-Vergleich der Änderungen.",
	"tool.reminder.updated.dialog.current": "Aktuell",
	"tool.reminder.updated.dialog.previous": "Vorher",
	"tool.reminder.updated.undo.success":
		"✅ Rückgängig: Erinnerung wiederhergestellt",
	"tool.reminder.deleted.message": "Erinnerung entfernt: {$text}",
	"tool.reminder.deleted.undone":
		"Erinnerung {$text} entfernt (rückgängig gemacht)",
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
	"tool.userQuestion.title": "Frage",
	"tool.userQuestion.result.questionLabel": "F:",
	"tool.userQuestion.result.answerLabel": "A:",

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
