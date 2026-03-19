import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import type { co } from "jazz-tools"
import { generateAuthToken } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { T, useIntl } from "#shared/intl/setup"
import { toast } from "sonner"
import { tryCatch } from "#shared/lib/trycatch"
import type { NotificationQuery } from "../lib/notification-types"

export { AddDeviceDrawer }

interface AddDeviceDrawerProps {
	me: co.loaded<typeof UserAccount, NotificationQuery>
	disabled?: boolean
	refreshEndpoint: () => void
	initialPermission: NotificationPermission
	defaultDeviceName: string
	requestPermission: () => Promise<NotificationPermission>
	subscribeToPush: () => Promise<{
		endpoint: string
		keys: { p256dh: string; auth: string }
	}>
	triggerRegistration: (
		notificationSettingsId: string,
		authToken: string,
	) => Promise<{ ok: true } | { ok: false; error: string }>
}

function AddDeviceDrawer({
	me,
	disabled,
	refreshEndpoint,
	initialPermission,
	defaultDeviceName,
	requestPermission,
	subscribeToPush,
	triggerRegistration,
}: AddDeviceDrawerProps) {
	let t = useIntl()
	let notifications = me?.root.notificationSettings
	let [open, setOpen] = useState(false)
	let [permission, setPermission] =
		useState<NotificationPermission>(initialPermission)

	let addDeviceSchema = z.object({
		deviceName: z.string().min(1, t("notifications.devices.name.required")),
	})

	let form = useForm<z.infer<typeof addDeviceSchema>>({
		resolver: zodResolver(addDeviceSchema),
		defaultValues: {
			deviceName: defaultDeviceName,
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
		let permissionResult = await tryCatch(requestPermission())
		if (!permissionResult.ok) {
			toast.error(t("notifications.devices.permissionError"))
			return
		}

		setPermission(permissionResult.data)

		if (permissionResult.data !== "granted") {
			toast.warning(t("notifications.permission.denied.description"))
			return
		}

		let subscriptionResult = await tryCatch(subscribeToPush())
		if (!subscriptionResult.ok) {
			toast.error(t("notifications.toast.subscribeFailed"))
			return
		}

		let deviceData = {
			deviceName: values.deviceName,
			endpoint: subscriptionResult.data.endpoint,
			keys: subscriptionResult.data.keys,
		}

		if (notifications?.$jazz.id) {
			let authToken = generateAuthToken(me)
			let registrationResult = await triggerRegistration(
				notifications.$jazz.id,
				authToken,
			)
			if (!registrationResult.ok) {
				toast.warning(t("notifications.toast.registrationFailed"))
				setOpen(false)
				form.reset({
					deviceName: defaultDeviceName,
				})
				return
			}
		}

		addPushDevice(deviceData)

		toast.success(t("notifications.toast.deviceAdded"))
		setOpen(false)

		form.reset({
			deviceName: defaultDeviceName,
		})
	}

	let isPermissionDenied = permission === "denied"

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" disabled={disabled}>
						<T k="notifications.devices.addButton" />
					</Button>
				}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<T k="notifications.devices.addDrawer.title" />
					</DialogTitle>
					<DialogDescription>
						{isPermissionDenied ? (
							<T k="notifications.devices.addDrawer.description.blocked" />
						) : (
							<T k="notifications.devices.addDrawer.description.enabled" />
						)}
					</DialogDescription>
				</DialogHeader>
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
