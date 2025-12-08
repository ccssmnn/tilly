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
	"person.crop.description":
		"Drag to select the square area of the photo you want to keep.",
	"person.crop.cancel": "Cancel",
	"person.crop.confirm": "Crop",
	"person.detail.pageTitle": "{$name} - Tilly",
	"person.detail.search.placeholder": "Search notes and reminders...",
	"person.detail.notes.tab": "Notes ({$count :number})",
	"person.detail.reminders.tab": "Reminder ({$count :number})",
	"person.detail.addNote": "Add Note",
	"person.detail.addReminder": "Add Reminder",
	"person.actions.title": "Actions",
	"person.actions.description": "Choose what you want to do for {$name}.",
	"person.edit.title": "Edit Person",
	"person.edit.description": "Update this person's details and avatar.",
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
	"person.permanentDelete.button": "Permanently Delete",
	"person.toast.restored": "{$name} has been restored",
	"person.toast.permanentlyDeleted": "{$name} has been permanently deleted",

	// Manage lists dialog
	"person.manageLists.title": "Manage Lists",
	"person.manageLists.description":
		"Add {$name} to lists or remove them from existing lists",
	"person.manageLists.addToList": "Add to #{$listName}",
	"person.manageLists.removeFromList": "Remove from #{$listName}",
	"person.manageLists.createList": "Create new list",
	"person.manageLists.or": "or",
	"person.manageLists.toast.added": "Added {$name} to #{$listName}",
	"person.manageLists.toast.removed": "Removed {$name} from #{$listName}",
	"person.manageLists.toast.created": "Created list #{$listName}",

	// List form
	"person.listForm.name.label": "List name",
	"person.listForm.name.placeholder": "family",
	"person.listForm.name.description":
		"Lowercase alphanumeric and underscores only",
	"person.listForm.selectPeople.label": "Select people",
	"person.listForm.search.placeholder": "Search people...",
	"person.listForm.search.empty": "No people found",
	"person.listForm.cancel": "Cancel",
	"person.listForm.save": "Save",
	"person.listForm.saving": "Saving...",
	"person.listForm.delete": "Delete list",
	"person.listForm.validation.nameRequired": "List name is required",
	"person.listForm.validation.nameFormat":
		"Only lowercase letters, numbers, and underscores allowed",
	"person.listForm.validation.peopleRequired":
		"At least one person must be selected",

	// Edit list dialog
	"person.editList.title": "Edit {$hashtag} List",
	"person.editList.description": "Manage people in this list and rename it",
	"person.editList.deleteConfirm.title": "Delete {$hashtag} List",
	"person.editList.deleteConfirm.description":
		"This will remove {$hashtag} from {$count :number} people. This action cannot be undone.",
	"person.editList.deleteConfirm.delete": "Delete",

	// New list dialog
	"person.newList.title": "Create New List",
	"person.newList.description": "Create a list to organize people.",

	// List filter bar
	"person.listFilter.lists": "Lists",
	"person.listFilter.createNewList": "New List",
	"person.listFilter.editList": "Edit {$listName}",
	"person.listFilter.clearFilter": "Clear Filter",
	"person.listFilter.editTooltip": "Right-click or long press to edit",
	"person.listFilter.createTooltip": "Create new list",

	// Share dialog
	"person.share.button": "Share",
	"person.share.dialog.title": "Share {$name}",
	"person.share.dialog.description":
		"Invite others to collaborate on this person's notes and reminders.",
	"person.share.inviteLink.label": "Invite link",
	"person.share.inviteLink.generate": "Generate invite link",
	"person.share.inviteLink.copied": "Copied!",
	"person.share.collaborators.title": "Collaborators",
	"person.share.collaborators.remove": "Remove",
	"person.share.collaborators.empty": "No collaborators yet",
	"person.share.requiresPlus": "Sharing requires Plus",
	"person.share.remove.title": "Remove access?",
	"person.share.remove.description":
		"The following people will lose access because they joined via the same invite link:",
	"person.share.remove.confirm": "Remove access",
	"person.share.remove.success": "Access removed",
	"person.share.pending.title": "Pending invites",
	"person.share.pending.empty": "No pending invites",
	"person.share.pending.createdAt": "Created {$ago}",
	"person.share.pending.cancel": "Cancel",
	"person.share.pending.cancelSuccess": "Invite cancelled",
	"person.shared.badge": "Shared",
	"person.shared.indicator.tooltip": "Shared with you",
	"person.shared.indicator.owner.tooltip": "Shared with others",
	"person.shared.indicator.badge": "Shared",
	"person.shared.indicator.owner.badge": "Sharing",
	"person.shared.sharedBy": "Shared by {$name}",
	"person.shared.sharedWith": "Shared with {$name}",
	"person.shared.sharedWithCount":
		".input {$count :number} .match $count one {{Shared with {$count} person}} * {{Shared with {$count} people}}",

	// Leave shared person
	"person.leave.button": "Leave",
	"person.leave.title": "Leave {$name}?",
	"person.leave.description":
		"You will lose access to {$name} and all their notes and reminders.",
	"person.leave.confirm": "Leave",
	"person.leave.success": "You left {$name}",

	// Person access states
	"person.notFound.title": "Person Not Found",
	"person.notFound.description":
		"This person doesn't exist or may have been deleted.",
	"person.notFound.goBack": "Go Back",
	"person.notFound.goToPeople": "Go to People",
	"person.unauthorized.title": "Access Revoked",
	"person.unauthorized.description":
		"You no longer have access to this person. The owner may have removed you.",
	"person.unauthorized.goBack": "Go Back",
	"person.unauthorized.goToPeople": "Go to People",
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
	"person.crop.description":
		"Ziehe den Rahmen, um den quadratischen Bildausschnitt festzulegen.",
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
	"person.actions.description": "Wähle, was du für {$name} tun möchtest.",
	"person.edit.title": "Person bearbeiten",
	"person.edit.description":
		"Aktualisiere die Angaben und den Avatar dieser Person.",
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
	"person.permanentDelete.button": "Endgültig löschen",
	"person.toast.restored": "{$name} wurde wiederhergestellt",
	"person.toast.permanentlyDeleted": "{$name} wurde endgültig gelöscht",

	// Manage lists dialog
	"person.manageLists.title": "Listen verwalten",
	"person.manageLists.description":
		"Füge {$name} zu Listen hinzu oder entferne sie aus bestehenden Listen",
	"person.manageLists.addToList": "Zu #{$listName} hinzufügen",
	"person.manageLists.removeFromList": "Aus #{$listName} entfernen",
	"person.manageLists.createList": "Neue Liste erstellen",
	"person.manageLists.or": "oder",
	"person.manageLists.toast.added": "{$name} zu #{$listName} hinzugefügt",
	"person.manageLists.toast.removed": "{$name} aus #{$listName} entfernt",
	"person.manageLists.toast.created": "Liste #{$listName} erstellt",

	// List form
	"person.listForm.name.label": "Listenname",
	"person.listForm.name.placeholder": "familie",
	"person.listForm.name.description":
		"Nur Kleinbuchstaben, Zahlen und Unterstriche",
	"person.listForm.selectPeople.label": "Personen auswählen",
	"person.listForm.search.placeholder": "Personen suchen...",
	"person.listForm.search.empty": "Keine Personen gefunden",
	"person.listForm.cancel": "Abbrechen",
	"person.listForm.save": "Speichern",
	"person.listForm.saving": "Speichern...",
	"person.listForm.delete": "Liste löschen",
	"person.listForm.validation.nameRequired": "Listenname erforderlich",
	"person.listForm.validation.nameFormat":
		"Nur Kleinbuchstaben, Zahlen und Unterstriche erlaubt",
	"person.listForm.validation.peopleRequired":
		"Mindestens eine Person muss ausgewählt werden",

	// Edit list dialog
	"person.editList.title": "Liste {$hashtag} bearbeiten",
	"person.editList.description":
		"Verwalte Personen in dieser Liste und benenne sie um",
	"person.editList.deleteConfirm.title": "Liste {$hashtag} löschen",
	"person.editList.deleteConfirm.description":
		"Dies entfernt {$hashtag} von {$count :number} Personen. Diese Aktion kann nicht rückgängig gemacht werden.",
	"person.editList.deleteConfirm.delete": "Löschen",

	// New list dialog
	"person.newList.title": "Neue Liste erstellen",
	"person.newList.description":
		"Erstelle eine Liste, um Personen zu organisieren.",

	// List filter bar
	"person.listFilter.lists": "Listen",
	"person.listFilter.createNewList": "Neue Liste",
	"person.listFilter.editList": "{$listName} bearbeiten",
	"person.listFilter.clearFilter": "Filter löschen",
	"person.listFilter.editTooltip":
		"Klick mit der rechten Maustaste oder langer Druck zum Bearbeiten",
	"person.listFilter.createTooltip": "Neue Liste erstellen",

	// Share dialog
	"person.share.button": "Teilen",
	"person.share.dialog.title": "{$name} teilen",
	"person.share.dialog.description":
		"Lade andere ein, an Notizen und Erinnerungen dieser Person mitzuarbeiten.",
	"person.share.inviteLink.label": "Einladungslink",
	"person.share.inviteLink.generate": "Einladungslink erstellen",
	"person.share.inviteLink.copied": "Kopiert!",
	"person.share.collaborators.title": "Mitarbeiter",
	"person.share.collaborators.remove": "Entfernen",
	"person.share.collaborators.empty": "Noch keine Mitarbeiter",
	"person.share.requiresPlus": "Teilen erfordert Plus",
	"person.share.remove.title": "Zugriff entziehen?",
	"person.share.remove.description":
		"Die folgenden Personen verlieren den Zugriff, da sie über denselben Einladungslink beigetreten sind:",
	"person.share.remove.confirm": "Zugriff entziehen",
	"person.share.remove.success": "Zugriff entzogen",
	"person.share.pending.title": "Ausstehende Einladungen",
	"person.share.pending.empty": "Keine ausstehenden Einladungen",
	"person.share.pending.createdAt": "Erstellt {$ago}",
	"person.share.pending.cancel": "Abbrechen",
	"person.share.pending.cancelSuccess": "Einladung abgebrochen",
	"person.shared.badge": "Geteilt",
	"person.shared.indicator.tooltip": "Mit dir geteilt",
	"person.shared.indicator.owner.tooltip": "Mit anderen geteilt",
	"person.shared.indicator.badge": "Geteilt",
	"person.shared.indicator.owner.badge": "Teile",
	"person.shared.sharedBy": "Geteilt von {$name}",
	"person.shared.sharedWith": "Geteilt mit {$name}",
	"person.shared.sharedWithCount":
		".input {$count :number} .match $count one {{Geteilt mit {$count} Person}} * {{Geteilt mit {$count} Personen}}",

	// Leave shared person
	"person.leave.button": "Verlassen",
	"person.leave.title": "{$name} verlassen?",
	"person.leave.description":
		"Du verlierst den Zugriff auf {$name} und alle zugehörigen Notizen und Erinnerungen.",
	"person.leave.confirm": "Verlassen",
	"person.leave.success": "Du hast {$name} verlassen",

	// Person access states
	"person.notFound.title": "Person nicht gefunden",
	"person.notFound.description":
		"Diese Person existiert nicht oder wurde gelöscht.",
	"person.notFound.goBack": "Zurück",
	"person.notFound.goToPeople": "Zu Personen",
	"person.unauthorized.title": "Zugriff entzogen",
	"person.unauthorized.description":
		"Du hast keinen Zugriff mehr auf diese Person. Der Besitzer hat dich möglicherweise entfernt.",
	"person.unauthorized.goBack": "Zurück",
	"person.unauthorized.goToPeople": "Zu Personen",
})
