import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useHasPlusAccess } from "#app/hooks/use-plus-access"
import { useIsPWAInstalled } from "#app/hooks/use-pwa"
import { NotificationSection } from "../widgets/notification-section"
import { settingsResolve, type SettingsAccount } from "../lib/data"
import { SettingsPageTitle } from "../parts/settings-page-title"
import { AccountSection } from "../widgets/account-section"
import { ProfileSection } from "../widgets/profile-section"
import { AssistantSection } from "../widgets/assistant-section"
import { LanguageSection } from "../widgets/language-section"
import { PWASection } from "../widgets/pwa-section"
import { AppSection } from "../widgets/app-section"
import { DataSection } from "../widgets/data-section"
import { AboutSection } from "../widgets/about-section"

export { SettingsScreen }

type SettingsScreenProps = {
	fallback: SettingsAccount
}

function SettingsScreen({ fallback }: SettingsScreenProps) {
	let subscribedMe = useAccount(UserAccount, { resolve: settingsResolve })
	let me = subscribedMe.$isLoaded ? subscribedMe : fallback
	let { hasPlusAccess } = useHasPlusAccess()
	let isPWAInstalled = useIsPWAInstalled()

	return (
		<div className="space-y-8 pb-20 md:mt-10 md:space-y-6 md:pb-6">
			<SettingsPageTitle />
			<div className="divide-border divide-y">
				<AccountSection />
				<ProfileSection me={me} />
				{hasPlusAccess && <AssistantSection me={me} />}
				<LanguageSection me={me} />
				<NotificationSection me={me} />
				{!isPWAInstalled && <PWASection />}
				<AppSection />
				<DataSection me={me} />
				<AboutSection me={me} />
			</div>
		</div>
	)
}
