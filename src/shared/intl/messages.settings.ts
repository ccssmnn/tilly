import { messages, translate } from "@ccssmnn/intl"

export { baseSettingsMessages, deSettingsMessages }

const baseSettingsMessages = messages({
	// Settings page messages
	"settings.title": "Settings",
	"settings.pageTitle": "Settings",
	"settings.account.title": "Account",
	"settings.account.description.signedIn":
		"Manage your authentication status, access account settings, and handle your subscription.",
	"settings.account.description.signedOut.online":
		"Sign in to sync your data, manage your account, and access subscription features.",
	"settings.account.description.signedOut.offline":
		"Sign in requires an internet connection to access account and subscription features.",
	"settings.account.status.label": "Status",
	"settings.account.status.signedIn": "Signed in as {$email}",
	"settings.account.status.signedOut": "Not signed in",
	"settings.account.tier.label": "Plan",
	"settings.account.tier.plus": "Tilly Plus",
	"settings.account.tier.free": "Free",
	"settings.account.requiresInternet":
		"Account features require internet connection",
	"settings.account.offlineDescription":
		"Please connect to the internet to sign in or manage your account.",
	"settings.account.manageAccount": "Manage Account",
	"settings.account.manageSubscription": "Manage Subscription",
	"settings.account.signOut": "Sign Out",
	"settings.profile.title": "About You",
	"settings.profile.description": "Update your personal information.",
	"settings.profile.displayName.label": "Display Name",
	"settings.profile.displayName.placeholder": "No display name set",
	"settings.profile.displayName.change": "Change",
	"settings.profile.displayName.dialog.title": "Change Display Name",
	"settings.profile.displayName.current.label": "Current display name",
	"settings.profile.displayName.new.label": "New display name",
	"settings.profile.displayName.new.placeholder": "Enter your name",
	"settings.profile.displayName.new.description":
		"This is the name that will be displayed in your profile",
	"settings.profile.displayName.new.required": "Name is required.",
	"settings.profile.displayName.cancel": "Cancel",
	"settings.profile.displayName.save": "Save",
	"settings.agent.title": "AI Assistant",
	"settings.agent.description":
		"Configure your AI assistant and view usage statistics.",
	"settings.agent.displayName.label": "Your Name",
	"settings.agent.displayName.placeholder": "No name set",
	"settings.agent.displayName.change": "Change",
	"settings.agent.displayName.dialog.title": "Change Your Name",
	"settings.agent.displayName.dialog.description":
		"Update the name Tilly uses when talking to you.",
	"settings.agent.displayName.current.label": "Current name",
	"settings.agent.displayName.new.label": "New name",
	"settings.agent.displayName.new.placeholder": "Enter your name",
	"settings.agent.displayName.new.description":
		"This is the name Tilly will use to address you in conversations",
	"settings.agent.displayName.cancel": "Cancel",
	"settings.agent.displayName.save": "Save",
	"settings.agent.notifyOnComplete.label": "Notify when assistant completes",
	"settings.agent.notifyOnComplete.description":
		"Send a push notification when Tilly finishes responding (only if Tilly is running in the background)",
	"settings.agent.usage.title": "Usage",
	"settings.agent.usage.budget.label": "Usage this cycle",
	"settings.agent.usage.budget.reset": "Resets on {$date}",
	"settings.agent.reset.title": "Reset Assistant",
	"settings.agent.reset.description": "Clear chat history to start fresh.",
	"settings.agent.reset.button": "Reset Chat",
	"settings.agent.reset.dialog.title": "Reset Chat History?",
	"settings.agent.reset.dialog.description":
		"This will clear your current conversation with the assistant.",
	"settings.agent.reset.success": "Chat history cleared",
	"settings.data.title": "Your Data",
	"settings.data.description":
		"Export, import, or manage your relationship notes.",
	"settings.data.export.label": "Export Data",
	"settings.data.export.description":
		"Download all your relationship notes and details as JSON",
	"settings.data.import.label": "Import Data",
	"settings.data.import.description":
		"Upload a JSON file to restore your relationship notes",

	// Data deletion
	"settings.data.delete.title": "Delete All Your Data",
	"settings.data.delete.description":
		"Permanently delete all your data for this account. This action cannot be undone. We recommend exporting your data first so you can import it later.",
	"settings.data.delete.button": "Delete All Data",
	"settings.data.delete.dialog.title": "Delete All Data",
	"settings.data.delete.dialog.description":
		"This action will permanently delete all your people, notes, and reminders. This cannot be undone. We recommend exporting your data first so you can import it later.",
	"settings.data.delete.confirm.label": 'Type "delete all my data" to confirm:',
	"settings.data.delete.confirm.placeholder": "delete all my data",
	"settings.data.delete.confirm.error":
		'You must type "delete all my data" exactly',
	"settings.data.delete.deleting": "Deleting...",
	"settings.data.delete.success": "All data deleted successfully",
	"settings.data.delete.error.load": "Failed to load account data",
	"settings.data.delete.error.rootMissing": "Account root missing",
	"settings.about.title": "About",
	"settings.about.description":
		"Learn more about Tilly or redo the welcome tour.",
	"settings.about.visit": "Visit Website",
	"settings.about.learnMore": "Read About Journaling",
	"settings.about.redoTour": "Take the Tour",
	"settings.language.title": "Language",
	"settings.language.description": "Choose your preferred language.",
	"settings.language.select.label": "Language",
	"settings.language.comingSoon": "More languages coming soon",

	// PWA-related settings
	"settings.pwa.title": "App Installation",
	"settings.pwa.description.mobile":
		"Get the best experience with push notifications and faster access.",
	"settings.pwa.description.desktop":
		"Install Tilly as an app for a cleaner interface and quick access.",

	"settings.pwa.install.button": "Install App",
	"settings.pwa.install.description.mobile":
		"Add Tilly to your home screen for faster access. Push notifications require signing in.",
	"settings.pwa.install.description.desktop":
		"Install Tilly as an app to remove browser UI and launch it like any other app.",

	"settings.pwa.hideInstall.label": "Hide Install Button",
	"settings.pwa.hideInstall.description":
		"Hide the install button from the navigation menu",

	// PWA installation dialogs
	"pwa.install.title": "Install Tilly",
	"pwa.install.addToHomeScreen.chrome":
		'Select "Add to Home screen" or "Install app"',
	"pwa.install.addToHomeScreen.confirm": 'Tap "Add" or "Install" to confirm',
	"pwa.install.safari.scrollDown": 'Scroll down and tap "Add to Home Screen"',
	"pwa.install.safari.confirm": 'Tap "Add" to confirm',
	"pwa.install.chrome.browser": "Chrome/Edge:",
	"pwa.install.safari.browser": "Safari (Mac):",
	"pwa.install.firefox.browser": "Firefox:",
	"pwa.install.generic.instruction":
		'Look for an "Install" or "Add to Home Screen" option in your browser',
	"pwa.install.followPrompts":
		"Follow the prompts to add Tilly to your home screen",
	"pwa.install.dialog.title": "Install Tilly",
	"pwa.install.dialog.description.mobile":
		"Install Tilly as an app for faster access and push notifications.",
	"pwa.install.dialog.description.desktop":
		"Install Tilly as an app for a cleaner interface and quick access.",
	"pwa.install.dialog.later": "Maybe Later",
	"pwa.install.dialog.browser.title":
		"Install Tilly directly from your browser for the best experience.",
	"pwa.install.dialog.install": "Install Now",
	"pwa.install.android.title":
		"To install Tilly as a progressive web app on your Android device:",
	"pwa.install.android.step1": 'Select "Add to Home screen" or "Install app"',
	"pwa.install.android.step2": 'Tap "Add" or "Install" to confirm',
	"pwa.install.ios.title":
		"To install Tilly as a progressive web app on your iPhone or iPad:",
	"pwa.install.ios.step1": 'Scroll down and tap "Add to Home Screen"',
	"pwa.install.ios.step2": 'Tap "Add" to confirm',
	"pwa.install.ios.note":
		"Note: On iOS, installation is only available through the Safari browser.",
	"pwa.install.desktop.browser.title":
		"Install Tilly directly from your browser for a cleaner experience.",
	"pwa.install.desktop.title":
		"To install Tilly as a progressive web app on desktop:",
	"pwa.install.desktop.chrome": "Chrome/Edge:",
	"pwa.install.desktop.chrome.instruction":
		"Look for the install button in the address bar",
	"pwa.install.desktop.safari": "Safari (Mac):",
	"pwa.install.desktop.safari.instruction": "Click … Share → Add to Dock",
	"pwa.install.desktop.firefox": "Firefox:",
	"pwa.install.desktop.firefox.instruction": "Installation support varies",
	"pwa.install.generic.title": "To install Tilly as a progressive web app:",
	"pwa.install.generic.step1":
		'Look for an "Install" or "Add to Home Screen" option in your browser menu',
	"pwa.install.generic.step2":
		"Follow the prompts to add Tilly to your home screen",
	"pwa.install.android.menuStep":
		"Tap the menu (⋮) or {#shareIcon}share{/shareIcon} button in your browser",
	"pwa.install.ios.shareStep":
		"Tap the {#shareIcon}Share{/shareIcon} button at the bottom of Safari",

	// Notifications settings
	"notifications.title": "Push Notifications",
	"notifications.description":
		"Choose when you want to receive reminder notifications and manage your devices.",
	"notifications.signInRequired.title":
		"Sign in to get access to push notifications",
	"notifications.timing.heading": "Timing",
	"notifications.timezone.label": "Timezone",
	"notifications.timezone.change": "Change",
	"notifications.timezone.usingDefault":
		"Using your device's timezone as default",
	"notifications.timezone.dialog.title": "Change Timezone",
	"notifications.timezone.dialog.description":
		"Ensure reminders arrive at the right local time.",
	"notifications.timezone.current.label": "Current timezone",
	"notifications.timezone.new.label": "New timezone",
	"notifications.timezone.new.placeholder": "e.g., Europe/Berlin",
	"notifications.timezone.new.description":
		'Enter a valid IANA timezone identifier like "Europe/Berlin", "America/New_York", or "Asia/Tokyo"',
	"notifications.timezone.detectDevice": "Detect Device Timezone",
	"notifications.timezone.cancel": "Cancel",
	"notifications.timezone.save": "Save",
	"notifications.timezone.invalid": "Invalid timezone identifier",
	"notifications.time.label": "Notification Time",
	"notifications.time.change": "Change",
	"notifications.time.defaultMessage":
		"Using 12:00 PM as default notification time",
	"notifications.time.customMessage":
		"You'll receive notifications at this time each day in your timezone",
	"notifications.time.dialog.title": "Change Notification Time",
	"notifications.time.dialog.description":
		"Pick the daily time when reminders should be delivered.",
	"notifications.time.current.label": "Current notification time",
	"notifications.time.new.label": "New notification time",
	"notifications.time.new.placeholder": "Select notification time",
	"notifications.time.description":
		"Choose when you want to receive daily reminder notifications.",
	"notifications.devices.heading": "Devices",
	"notifications.devices.description":
		"Manage devices registered for push notifications.",
	"notifications.devices.noDevices.description":
		"Add devices to receive push notifications.",
	"notifications.devices.noDevices.title": "No Devices Added",
	"notifications.devices.noDevices.warning":
		"You will NOT receive any notifications until you add at least one device. Add this device to start receiving reminders.",
	"notifications.devices.thisDevice": "This device",
	"notifications.devices.actions.title": "Device Actions",
	"notifications.devices.actions.description":
		'What would you like to do with "{$deviceName}"?',
	"notifications.devices.table.device": "Device",
	"notifications.devices.table.browser": "Browser",
	"notifications.devices.table.os": "OS",
	"notifications.devices.table.lastActive": "Last Active",
	"notifications.devices.table.status": "Status",
	"notifications.devices.remove": "Remove",
	"notifications.devices.editName": "Edit name",
	"notifications.devices.editDialog.title": "Edit Device Name",
	"notifications.devices.editDialog.description":
		"Change the display name for this device.",
	"notifications.devices.remove.confirm.title": "Remove Device",
	"notifications.devices.remove.confirm.description":
		"Are you sure you want to remove this device? You will stop receiving notifications on it.",
	"notifications.devices.remove.confirm.cancel": "Cancel",
	"notifications.devices.remove.confirm.remove": "Remove",
	"notifications.devices.status.active": "Active",
	"notifications.devices.status.inactive": "Inactive",
	"notifications.devices.empty": "No devices registered for notifications yet.",
	"notifications.devices.enabled": "Enabled",
	"notifications.devices.disabled": "Disabled",
	"notifications.devices.sendTest": "Send test notification",
	"notifications.devices.sendingTest": "Sending...",
	"notifications.devices.enable": "Enable Notifications",
	"notifications.devices.disable": "Disable Notifications",
	"notifications.devices.endpointPrefix": "Endpoint:",
	"notifications.enable.heading": "Enable Notifications",
	"notifications.enable.description":
		"To receive reminders as push notifications, enable notifications for your account.",
	"notifications.enable.step1":
		"Grant permission when prompted by your browser.",
	"notifications.enable.step2":
		"Keep this device registered for notifications.",
	"notifications.enable.button": "Enable Push Notifications",
	"notifications.enable.success": "Notifications enabled successfully!",
	"notifications.enable.error": "Failed to enable notifications.",
	"notifications.permission.denied.title": "Permission Denied",
	"notifications.permission.denied.description":
		"Notifications are blocked in your browser settings. Please enable them to receive reminders.",
	"notifications.permission.openSettings": "Open Browser Settings",
	"notifications.register.title": "Register Device",
	"notifications.register.description":
		"Register this device to receive push notifications.",
	"notifications.register.button": "Register",
	"notifications.register.success": "Device registered successfully!",
	"notifications.register.error": "Failed to register device.",
	"notifications.unregister.title": "Unregister Device",
	"notifications.unregister.description":
		"Stop receiving notifications on this device.",
	"notifications.unregister.button": "Unregister",
	"notifications.unregister.success": "Device unregistered successfully!",
	"notifications.unregister.error": "Failed to unregister device.",
	"notifications.devices.permissionError":
		"Failed to request notification permission",
	"notifications.toast.unsubscribeFailed":
		"Failed to unsubscribe from notifications",
	"notifications.toast.subscribeFailed":
		"Failed to subscribe to push notifications",
	"notifications.toast.testSendFailed": "Failed to send test notification",
	"notifications.toast.testSendSuccess": "Test notification sent",
	"notifications.toast.deviceRemoved": "Device removed successfully",
	"notifications.toast.deviceAdded": "Device added successfully!",
	"notifications.toast.nameUpdated": "Device name updated",
	"notifications.lastDelivery.label": "Last Notification Check",
	"notifications.lastDelivery.reset": "Reset",
	"notifications.lastDelivery.description":
		"When reminders were last checked and, if needed, delivered. Reset this to force another check on the next hourly run.",
	"notifications.devices.addButton": "Add This Device",
	"notifications.devices.addDialog.title": "Add This Device",
	"notifications.devices.addDialog.description.enabled":
		"Enable push notifications for this device to receive reminders.",
	"notifications.devices.addDialog.description.blocked":
		"Push notifications are blocked. Please enable them in your browser settings.",
	"notifications.devices.nameLabel": "Device Name",
	"notifications.devices.name.required": "Device name is required",
	"notifications.devices.adding": "Adding...",
	"notifications.iosRequirement.title":
		"Push notifications require app installation",
	"notifications.iosRequirement.description":
		"On iOS, push notifications are only available after installing Tilly to your home screen. Install the app from the App Installation section below to enable push notifications.",
	"notifications.browserNotSupported.title": "Push notifications not available",
	"notifications.browserNotSupported.recommendation.ios":
		"On iOS, please use Safari and install the app for the full Tilly experience.",
	"notifications.browserNotSupported.recommendation.iosInApp":
		"On iOS, please open this link in Safari and install the app for the full Tilly experience.",
	"notifications.browserNotSupported.recommendation.android":
		"On Android, please use Chrome and install the app for the full Tilly experience.",
	"notifications.browserNotSupported.recommendation.androidInApp":
		"On Android, please open this link in Chrome and install the app for the full Tilly experience.",
	"notifications.browserNotSupported.recommendation.windows":
		"On Windows, please use Chrome or Edge for the full Tilly experience.",
	"notifications.browserNotSupported.recommendation.macos":
		"On macOS, please use Chrome or Safari for the full Tilly experience.",
	"notifications.browserNotSupported.recommendation.generic":
		"Please try using Chrome, Edge, or Safari for the full Tilly experience.",
	// Status messages
	"status.offline.title": "You're offline",
	"status.update.title": "Update available",
	"status.offline.tooltip": "You're offline",
	"status.offline.dialog.title": "Offline Mode",
	"status.offline.description": "Most of Tilly works offline.",
	"status.offline.feature.core": "View and edit people, notes, and reminders",
	"status.offline.feature.requiresInternet":
		"Sync, push notifications, and Tilly Assistant require internet",
	"status.update.tooltip": "Update available",
	"status.update.dialog.title": "Update Available",
	"status.update.description":
		"A new version of Tilly is available with improvements and bug fixes. The app will reload to apply the update.",
	"status.update.updating": "Updating...",
	"status.update.updateNow": "Update and Reload",
	"status.update.later": "Later",
	"status.notSignedIn.tooltip": "Not signed in",
	"status.notSignedIn.dialog.title": "Not Signed In",
	"status.notSignedIn.browserOnly":
		"Without sign in, the data is only stored in the browser",
	"status.notSignedIn.benefits":
		"Sign in to back up and sync your data, and receive push notifications",
	"status.notSignedIn.signIn": "Sign In",
})

let deSettingsMessages = translate(baseSettingsMessages, {
	// Settings page messages
	"settings.title": "Einstellungen",
	"settings.pageTitle": "Einstellungen",
	"settings.account.title": "Konto",
	"settings.account.description.signedIn":
		"Verwalte deinen Authentifizierungsstatus, greife auf Kontoeinstellungen zu und verwalte dein Abonnement.",
	"settings.account.description.signedOut.online":
		"Melde dich an, um deine Daten zu synchronisieren, dein Konto zu verwalten und auf Abonnement-Funktionen zuzugreifen.",
	"settings.account.description.signedOut.offline":
		"Für die Anmeldung ist eine Internetverbindung erforderlich, um auf Konto- und Abonnement-Funktionen zuzugreifen.",
	"settings.account.status.label": "Status",
	"settings.account.status.signedIn": "Angemeldet als {$email}",
	"settings.account.status.signedOut": "Nicht angemeldet",
	"settings.account.tier.label": "Tarif",
	"settings.account.tier.plus": "Tilly Plus",
	"settings.account.tier.free": "Kostenlos",
	"settings.account.requiresInternet":
		"Kontofunktionen erfordern eine Internetverbindung",
	"settings.account.offlineDescription":
		"Bitte stelle eine Internetverbindung her, um dich anzumelden oder dein Konto zu verwalten.",
	"settings.account.manageAccount": "Konto verwalten",
	"settings.account.manageSubscription": "Abonnement verwalten",
	"settings.account.signOut": "Abmelden",
	"settings.profile.title": "Über dich",
	"settings.profile.description":
		"Aktualisiere deine persönlichen Informationen.",
	"settings.profile.displayName.label": "Anzeigename",
	"settings.profile.displayName.placeholder": "Kein Anzeigename gesetzt",
	"settings.profile.displayName.change": "Ändern",
	"settings.profile.displayName.dialog.title": "Anzeigenamen ändern",
	"settings.profile.displayName.current.label": "Aktueller Anzeigename",
	"settings.profile.displayName.new.label": "Neuer Anzeigename",
	"settings.profile.displayName.new.placeholder": "Gib deinen Namen ein",
	"settings.profile.displayName.new.description":
		"Das ist der Name, der in deinem Profil angezeigt wird",
	"settings.profile.displayName.new.required": "Name ist erforderlich.",
	"settings.profile.displayName.cancel": "Abbrechen",
	"settings.profile.displayName.save": "Speichern",
	"settings.agent.title": "KI-Assistent",
	"settings.agent.description":
		"Konfiguriere deinen KI-Assistenten und sieh dir Nutzungsstatistiken an.",
	"settings.agent.displayName.label": "Dein Name",
	"settings.agent.displayName.placeholder": "Kein Name gesetzt",
	"settings.agent.displayName.change": "Ändern",
	"settings.agent.displayName.dialog.title": "Deinen Namen ändern",
	"settings.agent.displayName.dialog.description":
		"Aktualisiere den Namen, mit dem Tilly dich anspricht.",
	"settings.agent.displayName.current.label": "Aktueller Name",
	"settings.agent.displayName.new.label": "Neuer Name",
	"settings.agent.displayName.new.placeholder": "Gib deinen Namen ein",
	"settings.agent.displayName.new.description":
		"Das ist der Name, den Tilly in Gesprächen für dich verwenden wird",
	"settings.agent.displayName.cancel": "Abbrechen",
	"settings.agent.displayName.save": "Speichern",
	"settings.agent.notifyOnComplete.label": "Bei Fertigstellung benachrichtigen",
	"settings.agent.notifyOnComplete.description":
		"Eine Push-Benachrichtigung senden, wenn Tilly mit der Antwort fertig ist (nur wenn Tilly im Hintergrund läuft)",
	"settings.agent.usage.title": "Nutzung",
	"settings.agent.usage.budget.label": "Nutzung in diesem Zeitraum",
	"settings.agent.usage.budget.reset": "Setzt sich am {$date} zurück",
	"settings.agent.reset.title": "Assistent zurücksetzen",
	"settings.agent.reset.description":
		"Chat-Verlauf löschen und von vorne anfangen.",
	"settings.agent.reset.button": "Chat zurücksetzen",
	"settings.agent.reset.dialog.title": "Chat-Verlauf zurücksetzen?",
	"settings.agent.reset.dialog.description":
		"Dies löscht dein aktuelles Gespräch mit dem Assistenten.",
	"settings.agent.reset.success": "Chat-Verlauf gelöscht",
	"settings.data.title": "Deine Daten",
	"settings.data.description":
		"Exportiere, importiere oder verwalte deine Daten.",
	"settings.data.export.label": "Daten exportieren",
	"settings.data.export.description": "Lade alle deine Daten als JSON herunter",
	"settings.data.import.label": "Daten importieren",
	"settings.data.import.description":
		"Lade eine JSON-Datei hoch, um deine Daten wiederherzustellen.",

	// Data deletion
	"settings.data.delete.title": "Alle deine Daten löschen",
	"settings.data.delete.description":
		"Lösche dauerhaft alle deine Daten für dieses Konto. Diese Aktion kann nicht rückgängig gemacht werden. Wir empfehlen, deine Daten zuerst zu exportieren, damit du sie später wieder importieren kannst.",
	"settings.data.delete.button": "Alle Daten löschen",
	"settings.data.delete.dialog.title": "Alle Daten löschen",
	"settings.data.delete.dialog.description":
		"Diese Aktion löscht dauerhaft alle deine Daten: Personen, Notizen und Erinnerungen. Dies kann nicht rückgängig gemacht werden. Wir empfehlen, deine Daten zuerst zu exportieren, damit du sie später wieder importieren kannst.",
	"settings.data.delete.confirm.label":
		'Schreibe "delete all my data" zur Bestätigung:',
	"settings.data.delete.confirm.placeholder": "delete all my data",
	"settings.data.delete.confirm.error":
		'Du musst genau "delete all my data" eingeben',
	"settings.data.delete.deleting": "Lösche...",
	"settings.data.delete.success": "Alle Daten wurden erfolgreich gelöscht",
	"settings.data.delete.error.load": "Kontodaten konnten nicht geladen werden",
	"settings.data.delete.error.rootMissing": "Konto-Stammdaten fehlen",
	"settings.about.title": "Über",
	"settings.about.description":
		"Erfahre mehr über Tilly oder wiederhole die Willkommens-Tour.",
	"settings.about.visit": "Webseite besuchen",
	"settings.about.learnMore": "Über Journaling lesen",
	"settings.about.redoTour": "Tour starten",
	"settings.language.title": "Sprache",
	"settings.language.description": "Wähle deine bevorzugte Sprache.",
	"settings.language.select.label": "Sprache",
	"settings.language.comingSoon": "Weitere Sprachen folgen bald",

	// PWA-related settings
	"settings.pwa.title": "App-Installation",
	"settings.pwa.description.mobile":
		"Erhalte die beste Erfahrung mit Push-Benachrichtigungen und schnellerem Zugriff.",
	"settings.pwa.description.desktop":
		"Installiere Tilly als App für eine sauberere Oberfläche und schnellen Zugriff.",

	"settings.pwa.install.button": "App installieren",
	"settings.pwa.install.description.mobile":
		"Füge Tilly deinem Startbildschirm hinzu. Push-Benachrichtigungen erfordern eine Anmeldung.",
	"settings.pwa.install.description.desktop":
		"Installiere Tilly als App, um die Browser-UI zu entfernen und sie wie jede andere App zu starten.",

	"settings.pwa.hideInstall.label": "Installationsknopf ausblenden",
	"settings.pwa.hideInstall.description":
		"Blendet den Installationsknopf aus dem Navigationsmenü aus",

	// PWA installation dialogs
	"pwa.install.title": "Tilly installieren",
	"pwa.install.addToHomeScreen.chrome":
		'"Zum Startbildschirm hinzufügen" oder "App installieren" wählen',
	"pwa.install.addToHomeScreen.confirm":
		'Mit "Hinzufügen" oder "Installieren" bestätigen',
	"pwa.install.safari.scrollDown":
		'Nach unten scrollen und "Zum Home-Bildschirm" tippen',
	"pwa.install.safari.confirm": 'Mit "Hinzufügen" bestätigen',
	"pwa.install.chrome.browser": "Chrome/Edge:",
	"pwa.install.safari.browser": "Safari (Mac):",
	"pwa.install.firefox.browser": "Firefox:",
	"pwa.install.generic.instruction":
		'Im Browser nach "Installieren" oder "Zum Home-Bildschirm" suchen',
	"pwa.install.followPrompts": "Den Anweisungen folgen, um Tilly hinzuzufügen",
	"pwa.install.dialog.title": "Tilly installieren",
	"pwa.install.dialog.description.mobile":
		"Tilly als App installieren für schnellen Zugriff und Push-Benachrichtigungen.",
	"pwa.install.dialog.description.desktop":
		"Tilly als App installieren für eine aufgeräumte Oberfläche und schnellen Zugriff.",
	"pwa.install.dialog.later": "Vielleicht später",
	"pwa.install.dialog.browser.title":
		"Installiere Tilly direkt aus deinem Browser für die beste Erfahrung.",
	"pwa.install.dialog.install": "Jetzt installieren",
	"pwa.install.android.title": "So installierst du Tilly als PWA auf Android:",
	"pwa.install.android.step1":
		'"Zum Startbildschirm hinzufügen" oder "App installieren" wählen',
	"pwa.install.android.step2":
		'Mit "Hinzufügen" oder "Installieren" bestätigen',
	"pwa.install.ios.title":
		"So installierst du Tilly als PWA auf iPhone oder iPad:",
	"pwa.install.ios.step1":
		'Nach unten scrollen und "Zum Home-Bildschirm" tippen',
	"pwa.install.ios.step2": 'Mit "Hinzufügen" bestätigen',
	"pwa.install.ios.note":
		"Hinweis: Unter iOS ist die Installation nur über Safari möglich.",
	"pwa.install.desktop.browser.title":
		"Installiere Tilly direkt aus deinem Browser für ein sauberes Erlebnis.",
	"pwa.install.desktop.title":
		"So installierst du Tilly als PWA auf dem Desktop:",
	"pwa.install.desktop.chrome": "Chrome/Edge:",
	"pwa.install.desktop.chrome.instruction":
		"Nach der Installationsschaltfläche in der Adressleiste suchen",
	"pwa.install.desktop.safari": "Safari (Mac):",
	"pwa.install.desktop.safari.instruction": "… Teilen → Zum Dock hinzufügen",
	"pwa.install.desktop.firefox": "Firefox:",
	"pwa.install.desktop.firefox.instruction":
		"Installationsunterstützung variiert",
	"pwa.install.generic.title": "So installierst du Tilly als PWA:",
	"pwa.install.generic.step1":
		'Im Browsermenü nach "Installieren" oder "Zum Home-Bildschirm" suchen',
	"pwa.install.generic.step2": "Den Anweisungen folgen, um Tilly hinzuzufügen",
	"pwa.install.android.menuStep":
		"Menü (⋮) oder {#shareIcon}Teilen{/shareIcon} im Browser tippen",
	"pwa.install.ios.shareStep":
		"{#shareIcon}Teilen{/shareIcon}-Taste unten in Safari tippen",

	// Notifications settings
	"notifications.title": "Push-Benachrichtigungen",
	"notifications.description":
		"Wähle, wann du Erinnerungsbenachrichtigungen erhalten willst, und verwalte deine Geräte.",
	"notifications.signInRequired.title":
		"Melde dich an, um Zugriff auf Push-Benachrichtigungen zu erhalten",
	"notifications.timing.heading": "Zeitplanung",
	"notifications.timezone.label": "Zeitzone",
	"notifications.timezone.change": "Ändern",
	"notifications.timezone.usingDefault": "Zeitzone deines Geräts als Standard",
	"notifications.timezone.dialog.title": "Zeitzone ändern",
	"notifications.timezone.dialog.description":
		"Sorge dafür, dass Erinnerungen zur richtigen Zeit ankommen.",
	"notifications.timezone.current.label": "Aktuelle Zeitzone",
	"notifications.timezone.new.label": "Neue Zeitzone",
	"notifications.timezone.new.placeholder": "z. B. Europe/Berlin",
	"notifications.timezone.new.description":
		'Gültige IANA-Zeitzone eingeben, z. B. "Europe/Berlin", "America/New_York" oder "Asia/Tokyo"',
	"notifications.timezone.detectDevice": "Gerätezeitzone erkennen",
	"notifications.timezone.cancel": "Abbrechen",
	"notifications.timezone.save": "Speichern",
	"notifications.timezone.invalid": "Ungültiger Zeitzonenbezeichner",
	"notifications.time.label": "Benachrichtigungszeit",
	"notifications.time.change": "Ändern",
	"notifications.time.defaultMessage":
		"12:00 Uhr als Standard-Benachrichtigungszeit verwenden",
	"notifications.time.customMessage":
		"Du erhältst Benachrichtigungen täglich zu dieser Zeit in deiner Zeitzone",
	"notifications.time.dialog.title": "Benachrichtigungszeit ändern",
	"notifications.time.dialog.description":
		"Wähle, wann wir dir täglich Erinnerungen schicken sollen.",
	"notifications.time.current.label": "Aktuelle Benachrichtigungszeit",
	"notifications.time.new.label": "Neue Benachrichtigungszeit",
	"notifications.time.new.placeholder": "Benachrichtigungszeit auswählen",
	"notifications.time.description":
		"Wähle, wann du tägliche Erinnerungsbenachrichtigungen erhalten möchtest.",
	"notifications.devices.heading": "Geräte",
	"notifications.devices.description":
		"Geräte verwalten, die Push-Benachrichtigungen empfangen.",
	"notifications.devices.noDevices.description":
		"Füge Geräte hinzu, die Push-Benachrichtigungen erhalten.",
	"notifications.devices.noDevices.title": "Keine Geräte hinzugefügt",
	"notifications.devices.noDevices.warning":
		"Du wirst KEINE Benachrichtigungen erhalten, bis du mindestens ein Gerät hinzufügst. Füge dieses Gerät hinzu, um Erinnerungen zu erhalten.",
	"notifications.devices.thisDevice": "Dieses Gerät",
	"notifications.devices.actions.title": "Geräteaktionen",
	"notifications.devices.actions.description":
		'Was möchtest du mit „{$deviceName}" tun?',
	"notifications.devices.table.device": "Gerät",
	"notifications.devices.table.browser": "Browser",
	"notifications.devices.table.os": "OS",
	"notifications.devices.table.lastActive": "Zuletzt aktiv",
	"notifications.devices.table.status": "Status",
	"notifications.devices.remove": "Entfernen",
	"notifications.devices.editName": "Namen bearbeiten",
	"notifications.devices.editDialog.title": "Gerätenamen bearbeiten",
	"notifications.devices.editDialog.description":
		"Ändere den Anzeigenamen für dieses Gerät.",
	"notifications.devices.remove.confirm.title": "Gerät entfernen",
	"notifications.devices.remove.confirm.description":
		"Möchtest du dieses Gerät entfernen? Du erhältst darauf keine Benachrichtigungen mehr.",
	"notifications.devices.remove.confirm.cancel": "Abbrechen",
	"notifications.devices.remove.confirm.remove": "Entfernen",
	"notifications.devices.status.active": "Aktiv",
	"notifications.devices.status.inactive": "Inaktiv",
	"notifications.devices.empty":
		"Noch keine Geräte für Benachrichtigungen registriert.",
	"notifications.devices.enabled": "Aktiviert",
	"notifications.devices.disabled": "Deaktiviert",
	"notifications.devices.sendTest": "Testbenachrichtigung senden",
	"notifications.devices.sendingTest": "Senden...",
	"notifications.devices.enable": "Benachrichtigungen aktivieren",
	"notifications.devices.disable": "Benachrichtigungen deaktivieren",
	"notifications.devices.endpointPrefix": "Endpunkt:",
	"notifications.enable.heading": "Benachrichtigungen aktivieren",
	"notifications.enable.description":
		"Aktiviere Benachrichtigungen für dein Konto, um Erinnerungen zu erhalten.",
	"notifications.enable.step1":
		"Berechtigung erteilen, wenn der Browser danach fragt.",
	"notifications.enable.step2":
		"Dieses Gerät für Benachrichtigungen registriert lassen.",
	"notifications.enable.button": "Push-Benachrichtigungen aktivieren",
	"notifications.enable.success": "Benachrichtigungen erfolgreich aktiviert!",
	"notifications.enable.error":
		"Aktivieren der Benachrichtigungen fehlgeschlagen.",
	"notifications.permission.denied.title": "Berechtigung verweigert",
	"notifications.permission.denied.description":
		"Benachrichtigungen sind in deinen Browser-Einstellungen blockiert. Bitte aktiviere sie, um Erinnerungen zu erhalten.",
	"notifications.permission.openSettings": "Browsereinstellungen öffnen",
	"notifications.register.title": "Gerät registrieren",
	"notifications.register.description":
		"Dieses Gerät registrieren, um Push-Benachrichtigungen zu erhalten.",
	"notifications.register.button": "Registrieren",
	"notifications.register.success": "Gerät erfolgreich registriert!",
	"notifications.register.error": "Gerät konnte nicht registriert werden.",
	"notifications.unregister.title": "Gerät abmelden",
	"notifications.unregister.description":
		"Keine Benachrichtigungen mehr auf diesem Gerät erhalten.",
	"notifications.unregister.button": "Abmelden",
	"notifications.unregister.success": "Gerät erfolgreich abgemeldet!",
	"notifications.unregister.error": "Abmeldung fehlgeschlagen.",
	"notifications.devices.permissionError":
		"Anfrage für Benachrichtigungsberechtigung fehlgeschlagen",
	"notifications.toast.unsubscribeFailed":
		"Abmeldung von Benachrichtigungen fehlgeschlagen",
	"notifications.toast.subscribeFailed":
		"Anmeldung für Push-Benachrichtigungen fehlgeschlagen",
	"notifications.toast.testSendFailed":
		"Senden der Testbenachrichtigung fehlgeschlagen",
	"notifications.toast.testSendSuccess": "Testbenachrichtigung gesendet",
	"notifications.toast.deviceRemoved": "Gerät erfolgreich entfernt",
	"notifications.toast.deviceAdded": "Gerät erfolgreich hinzugefügt!",
	"notifications.toast.nameUpdated": "Gerätename aktualisiert",
	"notifications.lastDelivery.label": "Letzter Check",
	"notifications.lastDelivery.reset": "Zurücksetzen",
	"notifications.lastDelivery.description":
		"Wann Erinnerungen zuletzt geprüft und bei Bedarf zugestellt wurden. Setze dies zurück, um beim nächsten stündlichen Durchlauf eine erneute Prüfung zu erzwingen.",
	"notifications.devices.addButton": "Dieses Gerät hinzufügen",
	"notifications.devices.addDialog.title": "Dieses Gerät hinzufügen",
	"notifications.devices.addDialog.description.enabled":
		"Aktiviere Push-Benachrichtigungen für dieses Gerät, um Erinnerungen zu erhalten.",
	"notifications.devices.addDialog.description.blocked":
		"Push-Benachrichtigungen sind blockiert. Bitte aktiviere sie in deinen Browser-Einstellungen.",
	"notifications.devices.nameLabel": "Gerätename",
	"notifications.devices.name.required": "Gerätename ist erforderlich",
	"notifications.devices.adding": "Hinzufügen...",
	"notifications.iosRequirement.title":
		"Push-Benachrichtigungen erfordern App-Installation",
	"notifications.iosRequirement.description":
		"Unter iOS sind Push-Benachrichtigungen nur nach Installation von Tilly auf dem Home-Bildschirm verfügbar. Installiere die App unten im Abschnitt App-Installation.",
	"notifications.browserNotSupported.title":
		"Push-Benachrichtigungen nicht verfügbar",
	"notifications.browserNotSupported.recommendation.ios":
		"In iOS verwende bitte Safari und installiere die App für die vollständige Tilly-Erfahrung.",
	"notifications.browserNotSupported.recommendation.iosInApp":
		"In iOS öffne bitte diesen Link in Safari und installiere die App für die vollständige Tilly-Erfahrung.",
	"notifications.browserNotSupported.recommendation.android":
		"In Android verwende bitte Chrome und installiere die App für die vollständige Tilly-Erfahrung.",
	"notifications.browserNotSupported.recommendation.androidInApp":
		"In Android öffne bitte diesen Link in Chrome und installiere die App für die vollständige Tilly-Erfahrung.",
	"notifications.browserNotSupported.recommendation.windows":
		"In Windows verwende bitte Chrome oder Edge für die vollständige Tilly-Erfahrung.",
	"notifications.browserNotSupported.recommendation.macos":
		"In macOS verwende bitte Chrome oder Safari für die vollständige Tilly-Erfahrung.",
	"notifications.browserNotSupported.recommendation.generic":
		"Bitte verwende Chrome, Edge oder Safari für die vollständige Tilly-Erfahrung.",

	// Status messages
	"status.offline.title": "Du bist offline",
	"status.update.title": "Update verfügbar",
	"status.offline.tooltip": "Offline",
	"status.offline.dialog.title": "Offline-Modus",
	"status.offline.description":
		"Du bist gerade offline, aber die meisten Funktionen funktionieren trotzdem:",
	"status.offline.feature.core":
		"Personen, Notizen und Erinnerungen ansehen und bearbeiten",
	"status.offline.feature.requiresInternet":
		"Sync, Push-Benachrichtigungen und Tilly-Assistent benötigen Internet",
	"status.update.tooltip": "Update verfügbar",
	"status.update.dialog.title": "Update verfügbar",
	"status.update.description":
		"Eine neue Version von Tilly ist verfügbar – mit Verbesserungen und Fehlerbehebungen. Die App wird neu geladen, um das Update anzuwenden.",
	"status.update.updating": "Wird aktualisiert...",
	"status.update.updateNow": "Aktualisieren und neu laden",
	"status.update.later": "Später",
	"status.notSignedIn.tooltip": "Nicht angemeldet",
	"status.notSignedIn.dialog.title": "Nicht angemeldet",
	"status.notSignedIn.browserOnly":
		"Ohne Anmeldung werden die Daten nur im Browser gespeichert",
	"status.notSignedIn.benefits":
		"Melde dich an, um deine Daten zu sichern, zu synchronisieren und Push-Benachrichtigungen zu erhalten",
	"status.notSignedIn.signIn": "Anmelden",
})
