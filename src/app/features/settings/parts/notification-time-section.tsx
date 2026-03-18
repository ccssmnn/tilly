import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import type { co } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"
import { Label } from "#shared/ui/label"
import { Button } from "#shared/ui/button"
import { DisplayField } from "#shared/ui/display-field"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shared/ui/select"
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
import { T, useLocale } from "#shared/intl/setup"
import type { NotificationQuery } from "../lib/notification-types"

export { NotificationTimeSection }

let timeOptions = [
	{ value: "00:00", label: "12:00 AM (Midnight)" },
	{ value: "01:00", label: "1:00 AM" },
	{ value: "02:00", label: "2:00 AM" },
	{ value: "03:00", label: "3:00 AM" },
	{ value: "04:00", label: "4:00 AM" },
	{ value: "05:00", label: "5:00 AM" },
	{ value: "06:00", label: "6:00 AM" },
	{ value: "07:00", label: "7:00 AM" },
	{ value: "08:00", label: "8:00 AM" },
	{ value: "09:00", label: "9:00 AM" },
	{ value: "10:00", label: "10:00 AM" },
	{ value: "11:00", label: "11:00 AM" },
	{ value: "12:00", label: "12:00 PM (Noon)" },
	{ value: "13:00", label: "1:00 PM" },
	{ value: "14:00", label: "2:00 PM" },
	{ value: "15:00", label: "3:00 PM" },
	{ value: "16:00", label: "4:00 PM" },
	{ value: "17:00", label: "5:00 PM" },
	{ value: "18:00", label: "6:00 PM" },
	{ value: "19:00", label: "7:00 PM" },
	{ value: "20:00", label: "8:00 PM" },
	{ value: "21:00", label: "9:00 PM" },
	{ value: "22:00", label: "10:00 PM" },
	{ value: "23:00", label: "11:00 PM" },
]

let notificationTimeFormSchema = z.object({
	notificationTime: z
		.string()
		.refine(value => timeOptions.some(option => option.value === value), {
			message: "notifications.time.invalid",
		}),
})

function NotificationTimeSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, NotificationQuery>
}) {
	let notifications = me?.root.notificationSettings
	let currentNotificationTime = notifications?.notificationTime || "12:00"
	let usingDefaultTime = !notifications?.notificationTime
	let [isNotificationTimeDrawerOpen, setIsNotificationTimeDrawerOpen] =
		useState(false)

	let notificationTimeForm = useForm({
		resolver: zodResolver(notificationTimeFormSchema),
		defaultValues: {
			notificationTime: currentNotificationTime,
		},
	})

	function updateNotificationTime(time: string) {
		if (!notifications) return
		notifications.$jazz.set("notificationTime", time)
	}

	function handleOpenNotificationTimeDrawer() {
		setIsNotificationTimeDrawerOpen(true)
	}

	function handleCloseNotificationTimeDrawer() {
		setIsNotificationTimeDrawerOpen(false)
	}

	function handleNotificationTimeSubmit(
		data: z.infer<typeof notificationTimeFormSchema>,
	) {
		updateNotificationTime(data.notificationTime)
		setIsNotificationTimeDrawerOpen(false)
	}

	function handleNotificationTimeCancel() {
		notificationTimeForm.reset({ notificationTime: currentNotificationTime })
		setIsNotificationTimeDrawerOpen(false)
	}

	let locale = useLocale()
	return (
		<>
			<div className="space-y-2">
				<p className="text-sm font-medium">
					<T k="notifications.time.label" />
				</p>
				<div className="flex items-center gap-2">
					<DisplayField
						value={new Date(
							`1970-01-01T${currentNotificationTime}:00`,
						).toLocaleTimeString(locale, {
							hour: "2-digit",
							minute: "2-digit",
						})}
						className="flex-1"
					/>
					<Button variant="outline" onClick={handleOpenNotificationTimeDrawer}>
						<T k="notifications.time.change" />
					</Button>
				</div>
				<p className="text-muted-foreground text-sm">
					{usingDefaultTime ? (
						<T k="notifications.time.defaultMessage" />
					) : (
						<T k="notifications.time.customMessage" />
					)}
				</p>
			</div>

			<Dialog
				open={isNotificationTimeDrawerOpen}
				onOpenChange={handleCloseNotificationTimeDrawer}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="notifications.time.dialog.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="notifications.time.dialog.description" />
						</DialogDescription>
					</DialogHeader>
					<Form {...notificationTimeForm}>
						<form
							onSubmit={notificationTimeForm.handleSubmit(
								handleNotificationTimeSubmit,
							)}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label>
									<T k="notifications.time.current.label" />
								</Label>
								<p className="text-muted-foreground text-sm">
									{new Date(
										`1970-01-01T${currentNotificationTime}:00`,
									).toLocaleTimeString(locale, {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>

							<FormField
								control={notificationTimeForm.control}
								name="notificationTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											<T k="notifications.time.new.label" />
										</FormLabel>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={""} />
												</SelectTrigger>
												<SelectContent>
													{timeOptions.map(time => (
														<SelectItem key={time.value} value={time.value}>
															{new Date(
																`1970-01-01T${time.value}:00`,
															).toLocaleTimeString(locale, {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormDescription>
											<T k="notifications.time.description" />
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
									onClick={handleNotificationTimeCancel}
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
