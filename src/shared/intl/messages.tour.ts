import { messages, translate } from "@ccssmnn/intl"

export { baseTourMessages, deTourMessages }

const baseTourMessages = messages({
	// Welcome page messages
	"welcome.title": "Tilly",
	"welcome.subtitle": "Welcome to your relationship journal!",
	"welcome.takeTour": "Take the Tour",
	"welcome.skip": "Skip",
	"welcome.signIn": "Sign In",
	// Tour step messages
	"welcome.description":
		"Tilly is a pragmatic relationship journal. Built to help you remember what's important and reach out.",
	"install.title": "Install Tilly for the best experience",
	"addPerson.title": "Each Person has their own space",
	"addPerson.description":
		"Tilly organizes your journal by person. Get started by adding someone important.",
	"addPerson.button": "Add Person",
	"addNote.title": "Notes for what to remember",
	"addNote.description":
		"Notes are where you journal what you want to remember about someone.",
	"addNote.button": "Add note to {$name}",
	"addReminder.title": "Reminders to reach out",
	"addReminder.description":
		"Reminders help you stay connected and remember to reach out.",
	"addReminder.button": "Add reminder for {$name}",
	"finish.title": "Finish your Setup",
	"finish.backup": "Sign up to back up and sync your data",
	"finish.notifications": "Enable Push Notifications",
	"finish.plus": "Get Tilly Plus to have AI assist you",
	"finish.description": "You can do all of that in the settings",
	"finish.button": "Let's go",
	// Navigation
	"navigation.previous": "Previous",
	"navigation.next": "Next",
})

const deTourMessages = translate(baseTourMessages, {
	// Welcome page messages
	"welcome.title": "Tilly",
	"welcome.subtitle": "Willkommen in deinem Beziehungsjournal!",
	"welcome.takeTour": "Tour starten",
	"welcome.skip": "Überspringen",
	"welcome.signIn": "Anmelden",
	// Tour step messages
	"welcome.description":
		"Tilly ist ein pragmatisches Beziehungsjournal. Entwickelt, um dir zu helfen, dich an das Wichtige zu erinnern und Kontakt aufzunehmen.",
	"install.title": "Installiere Tilly für die beste Erfahrung",
	"addPerson.title": "Jede Person hat ihren eigenen Bereich",
	"addPerson.description":
		"Tilly organisiert dein Journal nach Personen. Beginne, indem du jemand Wichtiges hinzufügst.",
	"addPerson.button": "Person hinzufügen",
	"addNote.title": "Notizen für das, woran man sich erinnern möchte",
	"addNote.description":
		"Notizen sind der Ort, an dem du aufschreibst, woran du dich über jemanden erinnern möchtest.",
	"addNote.button": "Notiz für {$name} hinzufügen",
	"addReminder.title": "Erinnerungen, um Kontakt aufzunehmen",
	"addReminder.description":
		"Erinnerungen helfen dir, in Kontakt zu bleiben und daran zu denken, dich zu melden.",
	"addReminder.button": "Erinnerung für {$name} hinzufügen",
	"finish.title": "Schließe deine Einrichtung ab",
	"finish.backup":
		"Melde dich an, um deine Daten zu sichern und zu synchronisieren",
	"finish.notifications": "Push-Benachrichtigungen aktivieren",
	"finish.plus": "Hole dir Tilly Plus, um KI-Unterstützung zu erhalten",
	"finish.description": "All das kannst du in den Einstellungen tun",
	"finish.button": "Los geht's",
	// Navigation
	"navigation.previous": "Zurück",
	"navigation.next": "Weiter",
})
