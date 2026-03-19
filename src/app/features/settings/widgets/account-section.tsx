import {
	SignInButton,
	SignUpButton,
	SignOutButton,
	useAuth,
	useUser,
} from "@clerk/clerk-react"
import { useIsAuthenticated } from "jazz-tools/react"
import { Button } from "#shared/ui/button"
import { T, useIntl } from "#shared/intl/setup"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import { WifiOff01Icon } from "@hugeicons/core-free-icons"
import { SettingsSection } from "#app/features/settings/parts/settings-section"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { resetAppStore } from "#app/lib/store"
import {
	mobileActionGroupClass,
	mobileActionButtonClass,
	sectionStackClass,
} from "../lib/layout"
import { PUBLIC_CLERK_ACCOUNTS_URL } from "astro:env/client"

export { AccountSection }

function AccountSection() {
	let t = useIntl()
	let isAuthenticated = useIsAuthenticated()
	let auth = useAuth()
	let { user } = useUser()
	let isOnline = useOnlineStatus()

	return (
		<SettingsSection
			title={t("settings.account.title")}
			description={
				isAuthenticated
					? t("settings.account.description.signedIn")
					: isOnline
						? t("settings.account.description.signedOut.online")
						: t("settings.account.description.signedOut.offline")
			}
		>
			<div className={sectionStackClass}>
				{isAuthenticated ? (
					<>
						<div>
							<p className="mb-1 text-sm font-medium">
								<T k="settings.account.status.label" />
							</p>
							<p className="text-muted-foreground text-sm">
								{t("settings.account.status.signedIn", {
									email: user?.emailAddresses[0]?.emailAddress || "",
								})}
							</p>
							<div className={`mt-3 ${mobileActionGroupClass}`}>
								{isOnline ? (
									<Button
										variant="secondary"
										className={mobileActionButtonClass}
										nativeButton={false}
										render={<a href={`${PUBLIC_CLERK_ACCOUNTS_URL}/user`} />}
									>
										<T k="settings.account.manageAccount" />
									</Button>
								) : (
									<Button
										variant="secondary"
										className={mobileActionButtonClass}
										disabled
									>
										<T k="settings.account.manageAccount" />
									</Button>
								)}
								<SignOutButton redirectUrl="/app">
									<Button
										onClick={() => resetAppStore()}
										variant="outline"
										disabled={!isOnline}
										className={mobileActionButtonClass}
									>
										<T k="settings.account.signOut" />
									</Button>
								</SignOutButton>
							</div>
						</div>
						{auth.isLoaded && auth.isSignedIn && (
							<div>
								<p className="mb-1 text-sm font-medium">
									<T k="settings.account.tier.label" />
								</p>
								<p className="text-muted-foreground text-sm">
									{auth.has({ plan: "plus" })
										? t("settings.account.tier.plus")
										: t("settings.account.tier.free")}
								</p>
								<div className={`mt-3 ${mobileActionGroupClass}`}>
									{isOnline ? (
										<Button
											variant="secondary"
											className={mobileActionButtonClass}
											nativeButton={false}
											render={
												<a href={`${PUBLIC_CLERK_ACCOUNTS_URL}/user/billing`} />
											}
										>
											<T k="settings.account.manageSubscription" />
										</Button>
									) : (
										<Button
											variant="secondary"
											className={mobileActionButtonClass}
											disabled
										>
											<T k="settings.account.manageSubscription" />
										</Button>
									)}
								</div>
							</div>
						)}
					</>
				) : (
					<div>
						<p className="mb-1 text-sm font-medium">
							<T k="settings.account.status.label" />
						</p>
						<p className="text-muted-foreground text-sm">
							{t("settings.account.status.signedOut")}
						</p>
						<div className={`mt-3 ${mobileActionGroupClass}`}>
							<SignInButton mode="redirect" forceRedirectUrl="/app/settings">
								<Button
									disabled={!isOnline}
									className={mobileActionButtonClass}
								>
									<T k="auth.signIn.button" />
								</Button>
							</SignInButton>
							<SignUpButton mode="redirect" forceRedirectUrl="/app/settings">
								<Button
									variant="outline"
									disabled={!isOnline}
									className={mobileActionButtonClass}
								>
									<T k="auth.signUp.button" />
								</Button>
							</SignUpButton>
						</div>
					</div>
				)}
				{!isOnline && (
					<Alert variant="destructive">
						<HugeiconsIcon icon={WifiOff01Icon} className="h-4 w-4" />
						<AlertTitle>
							<T k="settings.account.requiresInternet" />
						</AlertTitle>
						<AlertDescription>
							<T k="settings.account.offlineDescription" />
						</AlertDescription>
					</Alert>
				)}
			</div>
		</SettingsSection>
	)
}
