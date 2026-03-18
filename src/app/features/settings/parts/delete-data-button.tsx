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
import { useAppStore } from "#app/lib/store"
import { UserAccount, Person } from "#shared/schema/user"
import { permanentlyDeleteAllPeople } from "#shared/lib/delete-covalue"
import { tryCatch } from "#shared/lib/trycatch"

export { DeleteDataButton }

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
