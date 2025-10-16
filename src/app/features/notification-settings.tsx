import { de as dfnsDe } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { useIsAuthenticated } from "jazz-tools/react"
import { co } from "jazz-tools"
import { PushDevice, UserAccount } from "#shared/schema/user"
import { Alert, AlertTitle, AlertDescription } from "#shared/ui/alert"
import { ExclamationTriangle } from "react-bootstrap-icons"
import { Label } from "#shared/ui/label"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Badge } from "#shared/ui/badge"
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import z from "zod"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { SettingsSection } from "#app/components/settings-section"
import { toast } from "sonner"
import { cn } from "#app/lib/utils"
import { apiClient } from "#app/lib/api-client"
import { PUBLIC_VAPID_KEY } from "astro:env/client"
import { getServiceWorkerRegistration } from "#app/lib/service-worker"
import { tryCatch } from "#shared/lib/trycatch"
import { useIsIOS, useIsPWAInstalled } from "#app/hooks/use-pwa"

export function NotificationSettings({
	me,
}: {
	me: co.loaded<typeof UserAccount, Query>
}) {
	let t = useIntl()
	let isAuthenticated = useIsAuthenticated()
	let isIOS = useIsIOS()
	let isPWAInstalled = useIsPWAInstalled()

	let [currentEndpoint] = useCurrentEndpoint()

	let devices = me?.root.notificationSettings?.pushDevices || []
	let isCurrentDeviceAdded =
		currentEndpoint && devices.some(d => d.endpoint === currentEndpoint)

	let isServiceWorkerSupported =
		"serviceWorker" in navigator && "PushManager" in window
	let canAddDevice = (!isIOS || isPWAInstalled) && isServiceWorkerSupported
	let browserRecommendation = getBrowserRecommendation()

	return (
		<SettingsSection
			title={t("notifications.title")}
			description={t("notifications.description")}
		>
			<div className="space-y-3">
				{!isAuthenticated && (
					<Alert>
						<ExclamationTriangle />
						<AlertTitle>
							<T k="notifications.signInRequired.title" />
						</AlertTitle>
					</Alert>
				)}
				{!isServiceWorkerSupported && (
					<Alert>
						<ExclamationTriangle />
						<AlertTitle>
							<T k="notifications.browserNotSupported.title" />
						</AlertTitle>
						<AlertDescription>
							<T k={browserRecommendation} />
						</AlertDescription>
					</Alert>
				)}
			</div>
			{isAuthenticated && (
				<div className="space-y-8">
					{/* Devices Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">
							<T k="notifications.devices.heading" />
						</h3>
						<div className="space-y-3">
							{devices.length > 0 ? (
								<>
									<p className="text-muted-foreground text-sm">
										<T k="notifications.devices.description" />
									</p>
									<div className="space-y-2">
										{devices.map(device => (
											<DeviceListItem
												key={device.endpoint}
												device={device}
												me={me}
											/>
										))}
									</div>
								</>
							) : (
								<>
									<Alert>
										<ExclamationTriangle />
										<AlertTitle>
											<T k="notifications.devices.noDevices.title" />
										</AlertTitle>
										<AlertDescription>
											<T k="notifications.devices.noDevices.warning" />
										</AlertDescription>
									</Alert>
									<p className="text-muted-foreground text-sm">
										<T k="notifications.devices.noDevices.description" />
									</p>
								</>
							)}
						</div>

						{!isCurrentDeviceAdded && canAddDevice && (
							<AddDeviceDialog me={me} disabled={!isAuthenticated} />
						)}

						{!isCurrentDeviceAdded && !canAddDevice && (
							<Alert>
								<ExclamationTriangle />
								<AlertTitle>
									<T k="notifications.iosRequirement.title" />
								</AlertTitle>
								<AlertDescription>
									<T k="notifications.iosRequirement.description" />
								</AlertDescription>
							</Alert>
						)}
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-medium">
							<T k="notifications.timing.heading" />
						</h3>
						<div className="space-y-4">
							<TimezoneSection me={me} />
							<NotificationTimeSection me={me} />
							<LastDeliveredSection me={me} />
						</div>
					</div>
				</div>
			)}
		</SettingsSection>
	)
}

type Query = {
	root: { notificationSettings: true }
}

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

let notificationTimeFormSchema = z.object({
	notificationTime: z
		.string()
		.refine(value => timeOptions.some(option => option.value === value), {
			message: "notifications.time.invalid",
		}),
})

function TimezoneSection({ me }: { me: co.loaded<typeof UserAccount, Query> }) {
	let notifications = me?.root.notificationSettings
	let currentTimezone =
		notifications?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
	let usingDefaultTimezone = !notifications?.timezone
	let [isTimezoneDialogOpen, setIsTimezoneDialogOpen] = useState(false)

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

	function handleOpenTimezoneDialog() {
		setIsTimezoneDialogOpen(true)
	}

	function handleCloseTimezoneDialog() {
		setIsTimezoneDialogOpen(false)
	}

	function handleDetectTimezone() {
		let deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
		timezoneForm.setValue("timezone", deviceTimezone)
		timezoneForm.clearErrors("timezone")
	}

	function handleTimezoneSubmit(data: z.infer<typeof timezoneFormSchema>) {
		updateTimezone(data.timezone)
		setIsTimezoneDialogOpen(false)
	}

	function handleTimezoneCancel() {
		timezoneForm.reset({ timezone: currentTimezone })
		setIsTimezoneDialogOpen(false)
	}

	return (
		<>
			<div className="space-y-2">
				<Label>
					<T k="notifications.timezone.label" />
				</Label>
				<div className="flex items-center gap-2">
					<Input value={currentTimezone} readOnly className="flex-1" />
					<Button variant="outline" onClick={handleOpenTimezoneDialog}>
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
				open={isTimezoneDialogOpen}
				onOpenChange={handleCloseTimezoneDialog}
			>
				<DialogContent
					titleSlot={
						<DialogTitle>
							<T k="notifications.timezone.dialog.title" />
						</DialogTitle>
					}
				>
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

function NotificationTimeSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, Query>
}) {
	let notifications = me?.root.notificationSettings
	let currentNotificationTime = notifications?.notificationTime || "12:00"
	let usingDefaultTime = !notifications?.notificationTime
	let [isNotificationTimeDialogOpen, setIsNotificationTimeDialogOpen] =
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

	function handleOpenNotificationTimeDialog() {
		setIsNotificationTimeDialogOpen(true)
	}

	function handleCloseNotificationTimeDialog() {
		setIsNotificationTimeDialogOpen(false)
	}

	function handleNotificationTimeSubmit(
		data: z.infer<typeof notificationTimeFormSchema>,
	) {
		updateNotificationTime(data.notificationTime)
		setIsNotificationTimeDialogOpen(false)
	}

	function handleNotificationTimeCancel() {
		notificationTimeForm.reset({ notificationTime: currentNotificationTime })
		setIsNotificationTimeDialogOpen(false)
	}

	let locale = useLocale()
	return (
		<>
			<div className="space-y-2">
				<Label>
					<T k="notifications.time.label" />
				</Label>
				<div className="flex items-center gap-2">
					<Input
						value={new Date(
							`1970-01-01T${currentNotificationTime}:00`,
						).toLocaleTimeString(locale, {
							hour: "2-digit",
							minute: "2-digit",
						})}
						readOnly
						className="flex-1"
					/>
					<Button variant="outline" onClick={handleOpenNotificationTimeDialog}>
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
				open={isNotificationTimeDialogOpen}
				onOpenChange={handleCloseNotificationTimeDialog}
			>
				<DialogContent
					titleSlot={
						<DialogTitle>
							<T k="notifications.time.dialog.title" />
						</DialogTitle>
					}
				>
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

function LastDeliveredSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, Query>
}) {
	let notifications = me?.root.notificationSettings
	let locale = useLocale()
	let dfnsLocale = locale === "de" ? dfnsDe : undefined

	function resetLastDeliveredAt() {
		if (!notifications) return
		notifications.$jazz.delete("lastDeliveredAt")
	}

	return (
		<div className="space-y-2">
			<Label>
				<T k="notifications.lastDelivery.label" />
			</Label>
			<div className="flex items-center gap-2">
				<Input
					value={
						notifications?.lastDeliveredAt
							? formatDistanceToNow(new Date(notifications.lastDeliveredAt), {
									addSuffix: true,
									locale: dfnsLocale,
								})
							: ""
					}
					readOnly
					className="flex-1"
				/>
				<Button
					variant="outline"
					onClick={resetLastDeliveredAt}
					disabled={!notifications?.lastDeliveredAt}
				>
					<T k="notifications.lastDelivery.reset" />
				</Button>
			</div>
			<p className="text-muted-foreground text-sm">
				<T k="notifications.lastDelivery.description" />
			</p>
		</div>
	)
}

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

interface DeviceListItemProps {
	device: {
		isEnabled: boolean
		deviceName: string
		endpoint: string
		keys: {
			p256dh: string
			auth: string
		}
	}
	me: co.loaded<typeof UserAccount, Query>
}

function DeviceListItem({ device, me }: DeviceListItemProps) {
	let t = useIntl()
	let notifications = me?.root.notificationSettings
	let [currentEndpoint, refreshEndpoint] = useCurrentEndpoint()
	let isCurrentDevice = device.endpoint === currentEndpoint
	let [actionsDialogOpen, setActionsDialogOpen] = useState(false)
	let [editDialogOpen, setEditDialogOpen] = useState(false)
	let [editName, setEditName] = useState(device.deviceName)
	let [isSendingTest, setIsSendingTest] = useState(false)

	function deletePushDevice(endpoint: string) {
		if (!notifications) return

		notifications.$jazz.set(
			"pushDevices",
			notifications.pushDevices.filter(d => d.endpoint !== endpoint),
		)
		refreshEndpoint()
	}

	function updatePushDevice(
		endpoint: string,
		updates: Partial<z.infer<typeof PushDevice>>,
	) {
		if (!notifications) return

		notifications.$jazz.set(
			"pushDevices",
			notifications.pushDevices.map(d =>
				d.endpoint === endpoint ? { ...d, ...updates } : d,
			),
		)
	}

	async function handleRemove() {
		if (isCurrentDevice) {
			let unsubscribeResult = await tryCatch(unsubscribeFromPushNotifications())
			if (!unsubscribeResult.ok) {
				toast.error(t("notifications.toast.unsubscribeFailed"))
				return
			}
		}

		deletePushDevice(device.endpoint)
		toast.success(t("notifications.toast.deviceRemoved"))
		setActionsDialogOpen(false)
	}

	async function handleToggleEnabled() {
		if (device.isEnabled && isCurrentDevice) {
			let unsubscribeResult = await tryCatch(unsubscribeFromPushNotifications())
			if (!unsubscribeResult.ok) {
				toast.error(t("notifications.toast.unsubscribeFailed"))
				return
			}
		}

		updatePushDevice(device.endpoint, { isEnabled: !device.isEnabled })
		setActionsDialogOpen(false)
	}

	function handleSaveName() {
		if (editName.trim()) {
			updatePushDevice(device.endpoint, { deviceName: editName.trim() })
			setEditDialogOpen(false)
			toast.success(t("notifications.toast.nameUpdated"))
		}
	}

	function handleCancelEdit() {
		setEditName(device.deviceName)
		setEditDialogOpen(false)
	}

	function handleEditNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		setEditName(e.target.value)
	}

	function handleEditNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") handleSaveName()
		if (e.key === "Escape") handleCancelEdit()
	}

	function handleEditDevice() {
		setActionsDialogOpen(false)
		setEditDialogOpen(true)
	}

	async function handleSendTestNotification() {
		setIsSendingTest(true)
		let result = await tryCatch(
			apiClient.push["send-test-notification"].$post({
				json: { endpoint: device.endpoint },
			}),
		)

		if (!result.ok) {
			toast.error(t("notifications.toast.testSendFailed"))
			setIsSendingTest(false)
			return
		}

		if (result.data.ok) {
			let data = await tryCatch(result.data.json())
			if (data.ok) {
				toast.success(data.data.message)
			} else {
				toast.success(t("notifications.toast.testSendSuccess"))
			}
		} else {
			let data = await tryCatch(result.data.json())
			let message =
				data.ok && "message" in data.data
					? data.data.message
					: t("notifications.toast.testSendFailed")
			toast.error(message)
		}
		setIsSendingTest(false)
	}

	return (
		<div
			className={cn(
				"flex items-start justify-between py-4 transition-all",
				(actionsDialogOpen || editDialogOpen) &&
					"bg-accent -mx-1 rounded-md px-1",
			)}
		>
			<div
				className="flex flex-1 cursor-pointer items-start gap-3"
				onClick={() => setActionsDialogOpen(true)}
			>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">{device.deviceName}</p>
						<div className="flex-1" />
						{isCurrentDevice && (
							<Badge variant="secondary" className="text-xs">
								<T k="notifications.devices.thisDevice" />
							</Badge>
						)}
						<Badge
							variant={device.isEnabled ? "default" : "outline"}
							className="text-xs"
						>
							{device.isEnabled ? (
								<T k="notifications.devices.enabled" />
							) : (
								<T k="notifications.devices.disabled" />
							)}
						</Badge>
					</div>
					<p className="text-muted-foreground text-xs">
						<T k="notifications.devices.endpointPrefix" />{" "}
						{device.endpoint.split("/").pop()?.slice(0, 16)}...
					</p>
				</div>
			</div>

			<Dialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="notifications.devices.actions.title" />
							</DialogTitle>
							<DialogDescription>
								<T
									k="notifications.devices.actions.description"
									params={{ deviceName: device.deviceName }}
								/>
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-3">
						<Button className="w-full" onClick={handleToggleEnabled}>
							{device.isEnabled ? (
								<T k="notifications.devices.disable" />
							) : (
								<T k="notifications.devices.enable" />
							)}
						</Button>
						{device.isEnabled && (
							<Button
								variant="outline"
								className="w-full"
								onClick={handleSendTestNotification}
								disabled={isSendingTest}
							>
								{isSendingTest ? (
									<T k="notifications.devices.sendingTest" />
								) : (
									<T k="notifications.devices.sendTest" />
								)}
							</Button>
						)}
						<div className="flex items-center gap-3">
							<Button
								variant="destructive"
								className="flex-1"
								onClick={handleRemove}
							>
								<T k="notifications.devices.remove" />
							</Button>
							<Button
								variant="secondary"
								className="flex-1"
								onClick={handleEditDevice}
							>
								<T k="notifications.devices.editName" />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent
					className="sm:max-w-[425px]"
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="notifications.devices.editDialog.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="notifications.devices.editDialog.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<div className="space-y-4">
						<Input
							value={editName}
							onChange={handleEditNameChange}
							placeholder=""
							onKeyDown={handleEditNameKeyDown}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handleCancelEdit}>
							<T k="common.cancel" />
						</Button>
						<Button onClick={handleSaveName} disabled={!editName.trim()}>
							<T k="common.save" />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

interface AddDeviceDialogProps {
	me: co.loaded<typeof UserAccount, Query>
	disabled?: boolean
}

function AddDeviceDialog({ me, disabled }: AddDeviceDialogProps) {
	let t = useIntl()
	let notifications = me?.root.notificationSettings
	let [, refreshEndpoint] = useCurrentEndpoint()
	let [open, setOpen] = useState(false)
	let [permission, setPermission] = useState<NotificationPermission>(
		getNotificationPermission(),
	)

	let addDeviceSchema = z.object({
		deviceName: z.string().min(1, t("notifications.devices.name.required")),
	})

	let form = useForm<z.infer<typeof addDeviceSchema>>({
		resolver: zodResolver(addDeviceSchema),
		defaultValues: {
			deviceName: getDeviceName(),
		},
	})

	async function addPushDevice(deviceData: {
		deviceName: string
		endpoint: string
		keys: { p256dh: string; auth: string }
	}) {
		if (!notifications) return

		let devices = notifications.pushDevices || []
		let existingDeviceIndex = devices.findIndex(
			d => d.endpoint === deviceData.endpoint,
		)

		if (existingDeviceIndex >= 0) {
			notifications.$jazz.set(
				"pushDevices",
				notifications.pushDevices.map(d =>
					d.endpoint === deviceData.endpoint
						? {
								isEnabled: true,
								deviceName: deviceData.deviceName,
								endpoint: deviceData.endpoint,
								keys: deviceData.keys,
							}
						: d,
				),
			)
		} else {
			notifications.$jazz.set("pushDevices", [
				...notifications.pushDevices,
				{
					isEnabled: true,
					deviceName: deviceData.deviceName,
					endpoint: deviceData.endpoint,
					keys: deviceData.keys,
				},
			])
		}

		refreshEndpoint()
	}

	function handleCancel() {
		setOpen(false)
	}

	async function handleAddDevice(values: z.infer<typeof addDeviceSchema>) {
		let permissionResult = await tryCatch(requestNotificationPermission())
		if (!permissionResult.ok) {
			toast.error(t("notifications.devices.permissionError"))
			return
		}

		setPermission(permissionResult.data)

		if (permissionResult.data !== "granted") {
			toast.warning(t("notifications.permission.denied.description"))
			return
		}

		let subscriptionResult = await tryCatch(subscribeToPushNotifications())
		if (!subscriptionResult.ok) {
			toast.error(t("notifications.toast.subscribeFailed"))
			return
		}

		addPushDevice({
			deviceName: values.deviceName,
			endpoint: subscriptionResult.data.endpoint,
			keys: subscriptionResult.data.keys,
		})

		toast.success(t("notifications.toast.deviceAdded"))
		setOpen(false)

		form.reset({
			deviceName: getDeviceName(),
		})
	}

	let isPermissionDenied = permission === "denied"

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" disabled={disabled}>
					<T k="notifications.devices.addButton" />
				</Button>
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-[425px]"
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="notifications.devices.addDialog.title" />
						</DialogTitle>
						<DialogDescription>
							{isPermissionDenied ? (
								<T k="notifications.devices.addDialog.description.blocked" />
							) : (
								<T k="notifications.devices.addDialog.description.enabled" />
							)}
						</DialogDescription>
					</DialogHeader>
				}
			>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleAddDevice)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="deviceName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="notifications.devices.nameLabel" />
									</FormLabel>
									<FormControl>
										<Input
											placeholder=""
											{...field}
											disabled={form.formState.isSubmitting}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={form.formState.isSubmitting}
							>
								<T k="common.cancel" />
							</Button>
							<Button
								type="submit"
								disabled={form.formState.isSubmitting || isPermissionDenied}
							>
								{form.formState.isSubmitting ? (
									<T k="notifications.devices.adding" />
								) : (
									<T k="notifications.devices.addButton" />
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!("Notification" in window)) {
		throw new Error("This browser does not support notifications")
	}

	if (!("serviceWorker" in navigator)) {
		throw new Error("This browser does not support service workers")
	}

	let permission = await Notification.requestPermission()
	return permission
}

function getNotificationPermission(): NotificationPermission {
	if (!("Notification" in window)) {
		return "denied"
	}
	return Notification.permission
}

function getDeviceName(): string {
	let userAgent = navigator.userAgent

	let os = "Unknown OS"
	if (userAgent.includes("Windows")) os = "Windows"
	else if (userAgent.includes("Mac")) os = "macOS"
	else if (userAgent.includes("Linux")) os = "Linux"
	else if (userAgent.includes("Android")) os = "Android"
	else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
		os = "iOS"

	let browser = "Unknown Browser"
	if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
		browser = "Chrome"
	else if (userAgent.includes("Firefox")) browser = "Firefox"
	else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
		browser = "Safari"
	else if (userAgent.includes("Edg")) browser = "Edge"

	return `${os} ${browser}`
}

function useCurrentEndpoint(): [string | null | undefined, () => void] {
	let [endpoint, setEndpoint] = useState<string | null | undefined>(undefined)
	let [initialized, setInitialized] = useState(false)

	async function refreshCurrentEndpoint() {
		async function getCurrentPushEndpoint(): Promise<string | null> {
			if ("serviceWorker" in navigator && "PushManager" in window) {
				let result = await tryCatch(
					(async () => {
						let registration = await navigator.serviceWorker.ready
						let subscription = await registration.pushManager.getSubscription()
						return subscription?.endpoint || null
					})(),
				)
				return result.ok ? result.data : null
			}
			return null
		}

		let newEndpoint = await getCurrentPushEndpoint()
		setEndpoint(newEndpoint)
	}

	if (!initialized) {
		setInitialized(true)
		refreshCurrentEndpoint()
	}

	return [endpoint, refreshCurrentEndpoint]
}

async function subscribeToPushNotifications(): Promise<{
	endpoint: string
	keys: {
		p256dh: string
		auth: string
	}
}> {
	let registrationResult = await tryCatch(getServiceWorkerRegistration())
	if (!registrationResult.ok) {
		throw new Error("Failed to get service worker registration")
	}

	let registration = registrationResult.data
	if (!registration) {
		throw new Error("Service worker not registered")
	}

	if (!PUBLIC_VAPID_KEY) {
		throw new Error("VAPID public key not configured")
	}

	let subscriptionResult = await tryCatch(
		registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: PUBLIC_VAPID_KEY,
		}),
	)

	if (!subscriptionResult.ok) {
		throw new Error("Failed to subscribe to push notifications")
	}

	let subscription = subscriptionResult.data

	let p256dh = subscription.getKey("p256dh")
	let auth = subscription.getKey("auth")

	if (!p256dh || !auth) {
		throw new Error(
			`received '${auth}' for auth and '${p256dh}' for p256dh, both must be nonempty`,
		)
	}

	return {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: arrayBufferToBase64(p256dh),
			auth: arrayBufferToBase64(auth),
		},
	}
}

async function unsubscribeFromPushNotifications(): Promise<boolean> {
	let registrationResult = await tryCatch(getServiceWorkerRegistration())
	if (!registrationResult.ok) {
		return false
	}

	let registration = registrationResult.data
	if (!registration) {
		return false
	}

	let subscriptionResult = await tryCatch(
		registration.pushManager.getSubscription(),
	)
	if (!subscriptionResult.ok) {
		return false
	}

	let subscription = subscriptionResult.data
	if (subscription) {
		let unsubscribeResult = await tryCatch(subscription.unsubscribe())
		return unsubscribeResult.ok ? unsubscribeResult.data : false
	}

	return false
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	let bytes = new Uint8Array(buffer)
	let binary = ""
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return window.btoa(binary)
}

function getBrowserRecommendation() {
	let userAgent = navigator.userAgent

	if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
		return "notifications.browserNotSupported.recommendation.ios" as const
	}

	if (userAgent.includes("Android")) {
		return "notifications.browserNotSupported.recommendation.android" as const
	}

	if (userAgent.includes("Windows")) {
		return "notifications.browserNotSupported.recommendation.windows" as const
	}

	if (userAgent.includes("Mac")) {
		return "notifications.browserNotSupported.recommendation.macos" as const
	}

	return "notifications.browserNotSupported.recommendation.generic" as const
}
