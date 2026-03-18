import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import type { co } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"
import { Label } from "#shared/ui/label"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { DisplayField } from "#shared/ui/display-field"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { T } from "#shared/intl/setup"
import type { NotificationQuery } from "../lib/notification-types"

export { TimezoneSection }

let timezoneFormSchema = z.object({
	timezone: z.string().refine(
		value => {
			try {
				// supportedValuesOf is not in all TypeScript versions but exists in modern browsers
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return (Intl as any).supportedValuesOf("timeZone").includes(value)
			} catch {
				return false
			}
		},
		{ message: "notifications.timezone.invalid" },
	),
})

function TimezoneSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, NotificationQuery>
}) {
	let notifications = me?.root.notificationSettings
	let currentTimezone =
		notifications?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
	let usingDefaultTimezone = !notifications?.timezone
	let [isTimezoneDrawerOpen, setIsTimezoneDrawerOpen] = useState(false)

	let timezoneForm = useForm({
		resolver: zodResolver(timezoneFormSchema),
		defaultValues: {
			timezone: currentTimezone,
		},
	})

	function updateTimezone(timezone: string) {
		if (!notifications) return
		notifications.$jazz.set("timezone", timezone)
	}

	function handleOpenTimezoneDrawer() {
		setIsTimezoneDrawerOpen(true)
	}

	function handleCloseTimezoneDrawer() {
		setIsTimezoneDrawerOpen(false)
	}

	function handleDetectTimezone() {
		let deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
		timezoneForm.setValue("timezone", deviceTimezone)
		timezoneForm.clearErrors("timezone")
	}

	function handleTimezoneSubmit(data: z.infer<typeof timezoneFormSchema>) {
		updateTimezone(data.timezone)
		setIsTimezoneDrawerOpen(false)
	}

	function handleTimezoneCancel() {
		timezoneForm.reset({ timezone: currentTimezone })
		setIsTimezoneDrawerOpen(false)
	}

	return (
		<>
			<div className="space-y-2">
				<p className="text-sm font-medium">
					<T k="notifications.timezone.label" />
				</p>
				<div className="flex items-center gap-2">
					<DisplayField value={currentTimezone} className="flex-1 rounded-lg" />
					<Button variant="outline" onClick={handleOpenTimezoneDrawer}>
						<T k="notifications.timezone.change" />
					</Button>
				</div>
				{usingDefaultTimezone && (
					<p className="text-muted-foreground text-sm">
						<T k="notifications.timezone.usingDefault" />
					</p>
				)}
			</div>

			<Dialog
				open={isTimezoneDrawerOpen}
				onOpenChange={handleCloseTimezoneDrawer}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="notifications.timezone.dialog.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="notifications.timezone.dialog.description" />
						</DialogDescription>
					</DialogHeader>
					<Form {...timezoneForm}>
						<form
							onSubmit={timezoneForm.handleSubmit(handleTimezoneSubmit)}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label>
									<T k="notifications.timezone.current.label" />
								</Label>
								<p className="text-muted-foreground text-sm">
									{currentTimezone}
								</p>
							</div>

							<FormField
								control={timezoneForm.control}
								name="timezone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											<T k="notifications.timezone.new.label" />
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={""}
												aria-label="timezone-input"
											/>
										</FormControl>
										<FormDescription>
											<T k="notifications.timezone.new.description" />
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="button"
								variant="outline"
								onClick={handleDetectTimezone}
								className="w-full"
							>
								<T k="notifications.timezone.detectDevice" />
							</Button>

							<div className="flex items-center gap-3">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={handleTimezoneCancel}
								>
									<T k="common.cancel" />
								</Button>
								<Button type="submit" className="flex-1">
									<T k="common.save" />
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	)
}
