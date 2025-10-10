import { createFileRoute, notFound } from "@tanstack/react-router"
import { SignOutButton, useAuth, useUser } from "@clerk/clerk-react"
import { useAccount, useIsAuthenticated } from "jazz-tools/react"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { UserAccount } from "#shared/schema/user"
import type { ResolveQuery } from "jazz-tools"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { Dialog, DialogContent, DialogTitle } from "#shared/ui/dialog"
import { Label } from "#shared/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shared/ui/select"
import { useState } from "react"
import { ExportButton as DownloadButton } from "#app/features/data-download-button"
import { UploadButton } from "#app/features/data-upload-button"
import { TypographyH1, TypographyMuted } from "#shared/ui/typography"
import { NotificationSettings } from "#app/features/notification-settings"
import { SettingsSection } from "#app/components/settings-section"
import { useIsPWAInstalled, useIsMobileDevice } from "#app/hooks/use-pwa"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { PWAInstallDialog } from "#app/components/pwa-install-dialog"
import { Switch } from "#shared/ui/switch"
import { Progress } from "#shared/ui/progress"
import { resetAppStore, useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { toast } from "sonner"
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#shared/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { WifiOff } from "react-bootstrap-icons"
import { tryCatch } from "#shared/lib/trycatch"
import { co } from "jazz-tools"
import { Person } from "#shared/schema/user"

export const Route = createFileRoute("/settings")({
	loader: async ({ context }) => {
		let me = context.me
		let loadedMe = await UserAccount.load(me.$jazz.id, {
			resolve: query,
		})
		if (!loadedMe) throw notFound()
		return { me: loadedMe }
	},
	component: SettingsScreen,
})

let query = {
	profile: true,
	root: {
		notificationSettings: true,
		usageTracking: true,
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function SettingsScreen() {
	let t = useIntl()
	let data = Route.useLoaderData()
	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})
	let currentMe = subscribedMe ?? data.me

	return (
		<div className="md:mt-12">
			<title>{t("settings.pageTitle")}</title>
			<TypographyH1>
				<T k="settings.title" />
			</TypographyH1>
			<div className="divide-border divide-y">
				<AuthenticationSection />
				<AgentSection me={currentMe} />
				<LanguageSection />
				<NotificationSettings me={currentMe} />
				<PWASection />
				<DataSection />
				<WebsiteSection />
			</div>
		</div>
	)
}

function LanguageSection() {
	let t = useIntl()
	let data = Route.useLoaderData()
	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})
	let currentMe = subscribedMe ?? data.me

	let currentLang = currentMe.root?.language || "en"

	function setLanguage(lang: "de" | "en") {
		if (!currentMe.root) return
		currentMe.root.$jazz.set("language", lang)
	}

	return (
		<SettingsSection
			title={t("settings.language.title")}
			description={t("settings.language.description")}
		>
			<div className="space-y-2">
				<Label>
					<T k="settings.language.select.label" />
				</Label>
				<Select value={currentLang} onValueChange={setLanguage}>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="w-full">
						<SelectItem value="en">
							<T k="language.name.en" />
						</SelectItem>
						<SelectItem value="de">
							<T k="language.name.de" />
						</SelectItem>
					</SelectContent>
				</Select>
				<TypographyMuted className="text-xs">
					<T k="settings.language.comingSoon" />
				</TypographyMuted>
			</div>
		</SettingsSection>
	)
}

function AuthenticationSection() {
	let t = useIntl()
	let isAuthenticated = useIsAuthenticated()
	let auth = useAuth()
	let { user } = useUser()

	let isOnline = useOnlineStatus()

	return (
		<SettingsSection
			title={t("settings.auth.title")}
			description={
				isAuthenticated
					? t("settings.auth.description.signedIn")
					: isOnline
						? t("settings.auth.description.signedOut.online")
						: t("settings.auth.description.signedOut.offline")
			}
		>
			<div className="space-y-6">
				<div>
					<p className="mb-1 text-sm font-medium">
						<T k="settings.auth.status.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						{isAuthenticated
							? t("settings.auth.status.signedIn", {
									email: user?.emailAddresses[0]?.emailAddress || "",
								})
							: t("settings.auth.status.signedOut")}
					</p>
				</div>
				{auth.isLoaded && auth.isSignedIn && (
					<div>
						<p className="mb-1 text-sm font-medium">
							<T k="settings.auth.tier.label" />
						</p>
						<p className="text-muted-foreground text-sm">
							{auth.has({ plan: "plus" })
								? t("settings.auth.tier.plus")
								: t("settings.auth.tier.free")}
						</p>
					</div>
				)}
				<div className="space-y-2">
					{!isOnline && (
						<Alert variant="destructive">
							<WifiOff className="h-4 w-4" />
							<AlertTitle>
								<T k="settings.auth.requiresInternet" />
							</AlertTitle>
							<AlertDescription>
								<T k="settings.auth.offlineDescription" />
							</AlertDescription>
						</Alert>
					)}
					<div className="inline-flex flex-wrap gap-3">
						{isAuthenticated ? (
							<>
								<Button asChild disabled={!isOnline}>
									<a
										href="https://accounts.tilly.social/user?redirect_url=https://tilly.social/app/settings"
										target="_blank"
										rel="noopener noreferrer"
									>
										<T k="settings.auth.manageAccount" />
									</a>
								</Button>
								<Button asChild variant="secondary" disabled={!isOnline}>
									<a
										href="https://accounts.tilly.social/user/billing?redirect_url=https://tilly.social/app/settings"
										target="_blank"
										rel="noopener noreferrer"
									>
										<T k="settings.auth.manageSubscription" />
									</a>
								</Button>
								<SignOutButton redirectUrl="/app">
									<Button
										onClick={() => resetAppStore()}
										variant="outline"
										disabled={!isOnline}
									>
										<T k="settings.auth.signOut" />
									</Button>
								</SignOutButton>
							</>
						) : (
							<div className="space-x-2">
								<Button
									asChild
									disabled={!isOnline}
									className="plausible--event-name=Sign+In"
								>
									<a
										href={`${getAccountsUrl()}/sign-in?redirect_url=${getCurrentUrl()}/app/settings`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<T k="auth.signIn.button" />
									</a>
								</Button>
								<Button
									asChild
									variant="outline"
									disabled={!isOnline}
									className="plausible--event-name=Sign+Up"
								>
									<a
										href={`${getAccountsUrl()}/sign-up?redirect_url=${getCurrentUrl()}/app/settings`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<T k="auth.signUp.button" />
									</a>
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</SettingsSection>
	)
}

let agentFormSchema = z.object({
	name: z.string().min(1, {
		message: "Name is required.",
	}),
})

function AgentSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, typeof query>
}) {
	let [isDisplayNameDialogOpen, setIsDisplayNameDialogOpen] = useState(false)
	let t = useIntl()

	function onSubmit(values: z.infer<typeof agentFormSchema>) {
		if (me?.profile) {
			me.profile.$jazz.set("name", values.name)
		}
		setIsDisplayNameDialogOpen(false)
	}

	let usageTracking = me.root?.usageTracking
	let usagePercentage = Math.round(usageTracking?.weeklyPercentUsed ?? 0)
	let usageResetDateString =
		usageTracking?.resetDate?.toLocaleDateString(me.root?.language ?? "en") ??
		""

	return (
		<SettingsSection
			title={t("settings.agent.title")}
			description={t("settings.agent.description")}
		>
			<div className="space-y-6">
				<div className="space-y-2">
					<Label>
						<T k="settings.agent.displayName.label" />
					</Label>
					<div className="flex items-center gap-2">
						<Input
							value={me?.profile?.name || ""}
							readOnly
							className="flex-1"
							placeholder={t("settings.agent.displayName.placeholder")}
						/>
						<Button
							variant="outline"
							onClick={() => setIsDisplayNameDialogOpen(true)}
							disabled={!me?.profile}
						>
							<T k="settings.agent.displayName.change" />
						</Button>
					</div>
				</div>

				{usageTracking && (
					<div className="space-y-4">
						<p className="mb-1 text-sm font-medium">
							<T k="settings.agent.usage.title" />
						</p>
						<div className="space-y-3">
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>
										<T k="settings.agent.usage.budget.label" />
									</span>
									<span>{usagePercentage}%</span>
								</div>
								<Progress value={usagePercentage} className="h-2" />
								<p className="text-muted-foreground text-xs">
									<T
										k="settings.agent.usage.budget.reset"
										params={{
											date: usageResetDateString,
										}}
									/>
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
			<AgentNameDialog
				currentName={me?.profile?.name || ""}
				isOpen={isDisplayNameDialogOpen}
				onClose={() => setIsDisplayNameDialogOpen(false)}
				onSave={onSubmit}
			/>
		</SettingsSection>
	)
}

interface AgentNameDialogProps {
	currentName: string
	isOpen: boolean
	onClose: () => void
	onSave: (values: z.infer<typeof agentFormSchema>) => void
}

function AgentNameDialog({
	currentName,
	isOpen,
	onClose,
	onSave,
}: AgentNameDialogProps) {
	let t = useIntl()
	let form = useForm<z.infer<typeof agentFormSchema>>({
		resolver: zodResolver(agentFormSchema),
		defaultValues: {
			name: currentName,
		},
	})

	function handleSubmit(data: z.infer<typeof agentFormSchema>) {
		onSave(data)
		onClose()
	}

	function handleCancel() {
		form.reset({ name: currentName })
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				titleSlot={
					<DialogTitle>
						<T k="settings.agent.displayName.dialog.title" />
					</DialogTitle>
				}
			>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label>
								<T k="settings.agent.displayName.current.label" />
							</Label>
							<p className="text-muted-foreground text-sm">
								{currentName || (
									<T k="settings.agent.displayName.placeholder" />
								)}
							</p>
						</div>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="settings.agent.displayName.new.label" />
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"settings.agent.displayName.new.placeholder",
											)}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										<T k="settings.agent.displayName.new.description" />
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={handleCancel}
							>
								<T k="settings.agent.displayName.cancel" />
							</Button>
							<Button type="submit" className="flex-1">
								<T k="settings.agent.displayName.save" />
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

function PWASection() {
	let t = useIntl()
	let isPWAInstalled = useIsPWAInstalled()
	let isMobileDevice = useIsMobileDevice()
	let [showInstallDialog, setShowInstallDialog] = useState(false)

	let hideInstallNavItem = useAppStore(state => state.hideInstallNavItem)
	let setHideInstallNavItem = useAppStore(state => state.setHideInstallNavItem)

	return (
		<>
			<SettingsSection
				title={t("settings.pwa.title")}
				description={
					isMobileDevice
						? t("settings.pwa.description.mobile")
						: t("settings.pwa.description.desktop")
				}
			>
				<div className="space-y-6">
					<div>
						<p className="mb-1 text-sm font-medium">
							<T k="settings.pwa.status.label" />
						</p>
						<p className="text-muted-foreground text-sm">
							{isPWAInstalled ? (
								<T k="settings.pwa.status.installed" />
							) : (
								<T k="settings.pwa.status.browser" />
							)}
						</p>
					</div>
					{!isPWAInstalled && (
						<div>
							<Button
								onClick={() => setShowInstallDialog(true)}
								className="plausible--event-name=Install+Click+Settings"
							>
								<T k="settings.pwa.install.button" />
							</Button>
							<p className="text-muted-foreground mt-2 text-xs">
								{isMobileDevice ? (
									<T k="settings.pwa.install.description.mobile" />
								) : (
									<T k="settings.pwa.install.description.desktop" />
								)}
							</p>
						</div>
					)}
					{isPWAInstalled && (
						<div className="space-y-2">
							<p className="text-sm font-medium">
								<T k="settings.pwa.benefits.title" />
							</p>
							<ul className="text-muted-foreground space-y-1 text-sm">
								{isMobileDevice ? (
									<>
										<li>
											<T k="settings.pwa.benefits.mobile.notifications" />
										</li>
										<li>
											<T k="settings.pwa.benefits.mobile.startup" />
										</li>
										<li>
											<T k="settings.pwa.benefits.mobile.experience" />
										</li>
										<li>
											<T k="settings.pwa.benefits.mobile.icon" />
										</li>
									</>
								) : (
									<>
										<li>
											<T k="settings.pwa.benefits.desktop.interface" />
										</li>
										<li>
											<T k="settings.pwa.benefits.desktop.launch" />
										</li>
										<li>
											<T k="settings.pwa.benefits.desktop.startup" />
										</li>
										<li>
											<T k="settings.pwa.benefits.desktop.window" />
										</li>
									</>
								)}
							</ul>
						</div>
					)}

					{isMobileDevice && !isPWAInstalled && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label htmlFor="hide-install-nav">
										<T k="settings.pwa.hideInstall.label" />
									</Label>
									<p className="text-muted-foreground text-xs">
										<T k="settings.pwa.hideInstall.description" />
									</p>
								</div>
								<Switch
									id="hide-install-nav"
									checked={hideInstallNavItem}
									onCheckedChange={setHideInstallNavItem}
								/>
							</div>
						</div>
					)}
				</div>
			</SettingsSection>
			<PWAInstallDialog
				open={showInstallDialog}
				onOpenChange={setShowInstallDialog}
				onInstallComplete={() => setShowInstallDialog(false)}
			/>
		</>
	)
}

function DataSection() {
	let t = useIntl()
	let data = Route.useLoaderData()
	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})
	let currentMe = subscribedMe ?? data.me

	return (
		<SettingsSection
			title={t("settings.data.title")}
			description={t("settings.data.description")}
		>
			<div className="space-y-6">
				<div>
					<p className="mb-1 text-sm font-medium">
						<T k="settings.data.export.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.export.description" />
					</p>
				</div>
				<div>
					<DownloadButton account={currentMe} />
				</div>

				<div>
					<p className="mb-1 text-sm font-medium">
						<T k="settings.data.import.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.import.description" />
					</p>
				</div>
				<div>
					<UploadButton userID={currentMe.$jazz.id} />
				</div>

				<div>
					<p className="text-destructive mb-1 text-sm font-medium">
						<T k="settings.data.delete.title" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.delete.description" />
					</p>
				</div>
				<div>
					<DeleteDataButton currentMe={currentMe} />
				</div>
			</div>
		</SettingsSection>
	)
}

function DeleteDataButton({
	currentMe,
}: {
	currentMe: co.loaded<typeof UserAccount>
}) {
	let [open, setOpen] = useState(false)
	let t = useIntl()

	let deleteFormSchema = z.object({
		confirmation: z.literal("delete all my data", {
			error: t("settings.data.delete.confirm.error"),
		}),
	})

	let form = useForm<z.infer<typeof deleteFormSchema>>({
		resolver: zodResolver(deleteFormSchema),
	})

	async function onSubmit() {
		let accountResult = await tryCatch(
			UserAccount.load(currentMe.$jazz.id, {
				resolve: { root: { people: true } },
			}),
		)
		if (!accountResult.ok || !accountResult.data) {
			toast.error(t("settings.data.delete.error.load"))
			return
		}

		let account = accountResult.data
		if (!account.root) {
			toast.error(t("settings.data.delete.error.rootMissing"))
			return
		}

		// Clear all people (and thus their notes/reminders) permanently
		account.root.$jazz.set("people", co.list(Person).create([]))

		// Also clear local UI data (chat, searches, install hint, etc.)
		let {
			clearChat,
			setPeopleSearchQuery,
			setRemindersSearchQuery,
			setPWAInstallHintDismissed,
			setHideInstallNavItem,
		} = useAppStore.getState()
		clearChat()
		setPeopleSearchQuery("")
		setRemindersSearchQuery("")
		setPWAInstallHintDismissed(false)
		setHideInstallNavItem(false)

		toast.success(t("settings.data.delete.success"))
		form.reset()
		setOpen(false)
	}

	function handleCancel() {
		form.reset()
		setOpen(false)
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<T k="settings.data.delete.button" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						<T k="settings.data.delete.dialog.title" />
					</AlertDialogTitle>
					<AlertDialogDescription>
						<T k="settings.data.delete.dialog.description" />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="confirmation"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="settings.data.delete.confirm.label" />
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"settings.data.delete.confirm.placeholder",
											)}
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<AlertDialogFooter>
							<AlertDialogCancel type="button" onClick={handleCancel}>
								<T k="common.cancel" />
							</AlertDialogCancel>
							<Button
								type="submit"
								variant="destructive"
								disabled={form.formState.isSubmitting}
							>
								{form.formState.isSubmitting ? (
									<T k="settings.data.delete.deleting" />
								) : (
									<T k="settings.data.delete.button" />
								)}
							</Button>
						</AlertDialogFooter>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function WebsiteSection() {
	let t = useIntl()
	return (
		<SettingsSection
			title={t("settings.website.title")}
			description={t("settings.website.description")}
		>
			<div>
				<Button asChild variant="outline">
					<a href="/" target="_blank" rel="noopener noreferrer">
						<T k="settings.website.visit" />
					</a>
				</Button>
			</div>
		</SettingsSection>
	)
}

function getAccountsUrl(): string {
	let isDevelopment = import.meta.env.DEV
	if (isDevelopment) {
		return "https://accounts.clerk.accounts.dev"
	}
	return "https://accounts.tilly.social"
}

function getCurrentUrl(): string {
	if (typeof window !== "undefined") {
		return window.location.origin
	}
	return import.meta.env.PUBLIC_SITE_URL || "https://tilly.social"
}
