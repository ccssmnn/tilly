import { messages, translate } from "@ccssmnn/intl"

export { baseTourMessages, deTourMessages }

const baseTourMessages = messages({
	// Welcome page messages
	"welcome.title": "Tilly",
	"welcome.subtitle": "Welcome to your relationship journal!",
	"welcome.takeTour": "Take the Tour",
	"welcome.skip": "Skip",
	"welcome.signIn": "Sign In",
})

const deTourMessages = translate(baseTourMessages, {
	// Welcome page messages
	"welcome.title": "Tilly",
	"welcome.subtitle": "Willkommen in deinem Beziehungsjournal!",
	"welcome.takeTour": "Tour starten",
	"welcome.skip": "Überspringen",
	"welcome.signIn": "Anmelden",
})
