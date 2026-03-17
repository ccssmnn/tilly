import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { co } from "jazz-tools"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
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
import { T, useIntl } from "#shared/intl/setup"
import { toast } from "sonner"
import { SettingsSection } from "#app/components/settings-section"
import { ExportButton as DownloadButton } from "#app/features/data-download-button"
import { UploadButton } from "#app/features/data-upload-button"
import { useAppStore } from "#app/lib/store"
import { UserAccount, Person } from "#shared/schema/user"
import { permanentlyDeleteAllPeople } from "#shared/lib/delete-covalue"
import { tryCatch } from "#shared/lib/trycatch"
import { sectionStackClass } from "../lib/layout"
import type { SettingsAccount } from "../lib/data"

export { DataSection }

function DataSection({ me }: { me: SettingsAccount }) {
	let t = useIntl()

	return (
		<SettingsSection
			title={t("settings.data.title")}
			description={t("settings.data.description")}
		>
			<div className={sectionStackClass}>
				<div className="space-y-2">
					<p className="mb-1 text-sm font-medium">
						<T k="settings.data.export.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.export.description" />
					</p>
					<DownloadButton account={me} />
				</div>

				<div className="space-y-2">
					<p className="mb-1 text-sm font-medium">
						<T k="settings.data.import.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.import.description" />
					</p>
					<UploadButton userID={me.$jazz.id} />
				</div>

				<div className="space-y-2">
					<p className="text-destructive mb-1 text-sm font-medium">
						<T k="settings.data.delete.title" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.delete.description" />
					</p>
					<DeleteDataButton currentMe={me} />
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
				resolve: {
					root: {
						people: { $each: true },
						inactivePeople: { $each: true },
					},
				},
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

		await permanentlyDeleteAllPeople(account)

		account.root.$jazz.set("people", co.list(Person).create([]))
		account.root.$jazz.set("inactivePeople", co.list(Person).create([]))

		if (account.root.assistant) {
			account.root.$jazz.delete("assistant")
		}

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
			<AlertDialogTrigger
				render={
					<Button variant="destructive">
						<T k="settings.data.delete.button" />
					</Button>
				}
			/>
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
