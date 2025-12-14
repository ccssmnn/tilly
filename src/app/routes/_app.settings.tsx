import { createFileRoute, notFound, Link } from "@tanstack/react-router"
import { SignOutButton, useAuth, useUser } from "@clerk/clerk-react"
import { getSignInUrl, getSignUpUrl } from "#app/lib/auth-utils"
import { useAccount, useIsAuthenticated } from "jazz-tools/react"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { DisplayField } from "#shared/ui/display-field"
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { Label } from "#shared/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shared/ui/select"
import { Switch } from "#shared/ui/switch"
import { useState } from "react"
import { ExportButton as DownloadButton } from "#app/features/data-download-button"
import { UploadButton } from "#app/features/data-upload-button"
import { TypographyH1, TypographyMuted } from "#shared/ui/typography"
import { NotificationSettings } from "#app/features/notification-settings"
import { SettingsSection } from "#app/components/settings-section"
import { isMobileDevice, useIsPWAInstalled } from "#app/hooks/use-pwa"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { PWAInstallDialog } from "#app/components/pwa-install-dialog"
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
import { WifiOff, Lightbulb, Book, Compass } from "react-bootstrap-icons"
import { tryCatch } from "#shared/lib/trycatch"
import { co } from "jazz-tools"
import { Person } from "#shared/schema/user"
import { useHasPlusAccess } from "#app/features/plus"

export const Route = createFileRoute("/_app/settings")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()

		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve: resolve,
		})
		if (!loadedMe.$isLoaded) throw notFound()
		return { me: loadedMe }
	},
	component: SettingsScreen,
})

let resolve = {
	profile: true,
	root: {
		assistant: true,
		notificationSettings: true,
		usageTracking: true,
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function SettingsScreen() {
	let t = useIntl()
	let data = Route.useLoaderData()
	let subscribedMe = useAccount(UserAccount, {
		resolve: resolve,
	})
	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data.me
	let { hasPlusAccess } = useHasPlusAccess()
	let isPWAInstalled = useIsPWAInstalled()

	return (
		<div className="space-y-8 pb-20 md:mt-12 md:pb-4">
			<title>{t("settings.pageTitle")}</title>
			<TypographyH1>
				<T k="settings.title" />
			</TypographyH1>
			<div className="divide-border divide-y">
				<AccountSection />
				<ProfileSection me={currentMe} />
				{hasPlusAccess && <AssistantSection me={currentMe} />}
				<LanguageSection />
				<NotificationSettings me={currentMe} />
				{!isPWAInstalled && <PWASection />}
				<DataSection />
				<AboutSection />
			</div>
		</div>
	)
}

function LanguageSection() {
	let t = useIntl()
	let data = Route.useLoaderData()
	let subscribedMe = useAccount(UserAccount, { resolve })
	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data.me

	let currentLang = currentMe.root.language || "en"

	function setLanguage(lang: "de" | "en") {
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
			<div className="space-y-6">
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
							<div className="mt-3 inline-flex flex-wrap gap-3">
								<Button asChild variant="secondary" disabled={!isOnline}>
									<a href={`${getAccountsUrl()}/user`}>
										<T k="settings.account.manageAccount" />
									</a>
								</Button>
								<SignOutButton redirectUrl="/app">
									<Button
										onClick={() => resetAppStore()}
										variant="outline"
										disabled={!isOnline}
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
								<div className="mt-3">
									<Button asChild variant="secondary" disabled={!isOnline}>
										<a href={`${getAccountsUrl()}/user/billing`}>
											<T k="settings.account.manageSubscription" />
										</a>
									</Button>
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
						<div className="mt-3 space-x-2">
							<Button asChild disabled={!isOnline}>
								<a href={getSignInUrl("/app/settings")}>
									<T k="auth.signIn.button" />
								</a>
							</Button>
							<Button asChild variant="outline" disabled={!isOnline}>
								<a href={getSignUpUrl("/app/settings")}>
									<T k="auth.signUp.button" />
								</a>
							</Button>
						</div>
					</div>
				)}
				<div className="space-y-2">
					{!isOnline && (
						<Alert variant="destructive">
							<WifiOff className="h-4 w-4" />
							<AlertTitle>
								<T k="settings.account.requiresInternet" />
							</AlertTitle>
							<AlertDescription>
								<T k="settings.account.offlineDescription" />
							</AlertDescription>
						</Alert>
					)}
				</div>
			</div>
		</SettingsSection>
	)
}

let profileFormSchema = z.object({
	name: z.string().min(1, {
		message: "Name is required.",
	}),
})

function ProfileSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, typeof resolve>
}) {
	let [isDisplayNameDialogOpen, setIsDisplayNameDialogOpen] = useState(false)
	let t = useIntl()

	function onSubmit(values: z.infer<typeof profileFormSchema>) {
		if (me?.profile) {
			me.profile.$jazz.set("name", values.name)
		}
		setIsDisplayNameDialogOpen(false)
	}

	return (
		<SettingsSection
			title={t("settings.profile.title")}
			description={t("settings.profile.description")}
		>
			<div className="space-y-6">
				<div className="space-y-2">
					<p className="text-sm font-medium">
						<T k="settings.profile.displayName.label" />
					</p>
					<div className="flex items-center gap-2">
						<DisplayField
							value={me?.profile?.name ?? ""}
							placeholder={<T k="settings.profile.displayName.placeholder" />}
							className="flex-1"
						/>
						<Button
							variant="outline"
							onClick={() => setIsDisplayNameDialogOpen(true)}
							disabled={!me?.profile}
						>
							<T k="settings.profile.displayName.change" />
						</Button>
					</div>
				</div>
			</div>
			<ProfileNameDialog
				currentName={me?.profile?.name || ""}
				isOpen={isDisplayNameDialogOpen}
				onClose={() => setIsDisplayNameDialogOpen(false)}
				onSave={onSubmit}
			/>
		</SettingsSection>
	)
}

interface ProfileNameDialogProps {
	currentName: string
	isOpen: boolean
	onClose: () => void
	onSave: (values: z.infer<typeof profileFormSchema>) => void
}

function ProfileNameDialog({
	currentName,
	isOpen,
	onClose,
	onSave,
}: ProfileNameDialogProps) {
	let t = useIntl()
	let form = useForm<z.infer<typeof profileFormSchema>>({
		resolver: zodResolver(profileFormSchema),
		defaultValues: {
			name: currentName,
		},
	})

	function handleSubmit(data: z.infer<typeof profileFormSchema>) {
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
					<DialogHeader>
						<DialogTitle>
							<T k="settings.profile.displayName.dialog.title" />
						</DialogTitle>
					</DialogHeader>
				}
			>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label>
								<T k="settings.profile.displayName.current.label" />
							</Label>
							<p className="text-muted-foreground text-sm">
								{currentName || (
									<T k="settings.profile.displayName.placeholder" />
								)}
							</p>
						</div>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="settings.profile.displayName.new.label" />
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"settings.profile.displayName.new.placeholder",
											)}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										<T k="settings.profile.displayName.new.description" />
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
								<T k="settings.profile.displayName.cancel" />
							</Button>
							<Button type="submit" className="flex-1">
								<T k="settings.profile.displayName.save" />
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

function AssistantSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, typeof resolve>
}) {
	let [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
	let t = useIntl()

	let usageTracking = me.root.usageTracking
	let usagePercentage = Math.round(usageTracking?.weeklyPercentUsed ?? 0)
	let usageResetDateString =
		usageTracking?.resetDate?.toLocaleDateString(me.root.language ?? "en") ?? ""

	let hasPushDevices =
		(me.root.notificationSettings?.pushDevices?.length ?? 0) > 0

	function handleNotifyOnCompleteChange(checked: boolean) {
		if (!me.root.assistant?.$isLoaded) return
		me.root.assistant.$jazz.set("notifyOnComplete", checked)
	}

	function handleResetAssistant() {
		if (!me.root.assistant) return
		me.root.$jazz.delete("assistant")
		toast.success(t("settings.agent.reset.success"))
		setIsResetDialogOpen(false)
	}

	return (
		<SettingsSection
			title={t("settings.agent.title")}
			description={t("settings.agent.description")}
		>
			<div className="space-y-6">
				{hasPushDevices && (
					<div className="flex items-center justify-between gap-3">
						<div className="space-y-1">
							<Label htmlFor="notify-on-complete">
								<T k="settings.agent.notifyOnComplete.label" />
							</Label>
							<TypographyMuted>
								<T k="settings.agent.notifyOnComplete.description" />
							</TypographyMuted>
						</div>
						<Switch
							id="notify-on-complete"
							checked={me.root.assistant?.notifyOnComplete !== false}
							onCheckedChange={handleNotifyOnCompleteChange}
						/>
					</div>
				)}
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
				<div className="space-y-2">
					<p className="mb-1 text-sm font-medium">
						<T k="settings.agent.reset.title" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.agent.reset.description" />
					</p>
					<Button variant="outline" onClick={() => setIsResetDialogOpen(true)}>
						<T k="settings.agent.reset.button" />
					</Button>
				</div>
			</div>
			<Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="settings.agent.reset.dialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="settings.agent.reset.dialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => setIsResetDialogOpen(false)}
						>
							<T k="common.cancel" />
						</Button>
						<Button className="flex-1" onClick={handleResetAssistant}>
							<T k="settings.agent.reset.button" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</SettingsSection>
	)
}

function PWASection() {
	let t = useIntl()
	let isPWAInstalled = useIsPWAInstalled()
	let [showInstallDialog, setShowInstallDialog] = useState(false)

	if (isPWAInstalled) {
		return null
	}

	return (
		<>
			<SettingsSection
				title={t("settings.pwa.title")}
				description={
					isMobileDevice()
						? t("settings.pwa.description.mobile")
						: t("settings.pwa.description.desktop")
				}
			>
				<div className="space-y-6">
					<div>
						<Button onClick={() => setShowInstallDialog(true)}>
							<T k="settings.pwa.install.button" />
						</Button>
						<p className="text-muted-foreground mt-2 text-xs">
							{isMobileDevice() ? (
								<T k="settings.pwa.install.description.mobile" />
							) : (
								<T k="settings.pwa.install.description.desktop" />
							)}
						</p>
					</div>
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
	let subscribedMe = useAccount(UserAccount, {
		resolve: resolve,
	})
	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data.me

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
		if (!accountResult.ok || !accountResult.data.$isLoaded) {
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

		// Clear chat history
		if (account.root.assistant) {
			account.root.$jazz.delete("assistant")
		}

		// Also clear local UI data (searches, install hint, etc.)
		let {
			setPeopleSearchQuery,
			setRemindersSearchQuery,
			setPWAInstallHintDismissed,
			setHideInstallNavItem,
		} = useAppStore.getState()
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

function AboutSection() {
	let t = useIntl()
	let setTourSkipped = useAppStore(s => s.setTourSkipped)
	let data = Route.useLoaderData()
	let subscribedMe = useAccount(UserAccount, { resolve })
	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data.me
	let currentLang = currentMe.root.language || "en"

	return (
		<SettingsSection
			title={t("settings.about.title")}
			description={t("settings.about.description")}
		>
			<div className="space-y-3">
				<Button asChild variant="outline" className="w-full justify-start">
					<a href="/" target="_blank" rel="noopener noreferrer">
						<Compass />
						<T k="settings.about.visit" />
					</a>
				</Button>
				<Button asChild variant="outline" className="w-full justify-start">
					<a
						href={`/${currentLang}/blog/pragmatic-relationship-journaling`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Book />
						<T k="settings.about.learnMore" />
					</a>
				</Button>
				<Button
					variant="outline"
					className="w-full justify-start"
					onClick={() => setTourSkipped(false)}
					asChild
				>
					<Link to="/tour">
						<Lightbulb />
						<T k="settings.about.redoTour" />
					</Link>
				</Button>
			</div>
		</SettingsSection>
	)
}

import { PUBLIC_CLERK_ACCOUNTS_URL } from "astro:env/client"

function getAccountsUrl(): string {
	return PUBLIC_CLERK_ACCOUNTS_URL
}
