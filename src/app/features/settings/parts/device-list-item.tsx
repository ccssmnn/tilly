import { useState } from "react"
import type { co } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Badge } from "#shared/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"
import { T, useIntl } from "#shared/intl/setup"
import { PencilSquare, Trash, Power, BellFill } from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { useCurrentEndpoint } from "../hooks/use-current-endpoint"
import {
	handleToggleDeviceEnabled,
	handleSendTestNotification,
	handleRemoveDevice,
	handleSaveDeviceName,
} from "../lib/push-device-actions"
import type { NotificationQuery } from "../lib/notification-types"

export { DeviceListItem }
export type { DeviceListItemProps }

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
	me: co.loaded<typeof UserAccount, NotificationQuery>
}

function DeviceListItem({ device, me }: DeviceListItemProps) {
	let t = useIntl()
	let notifications = me?.root.notificationSettings
	let [currentEndpoint, refreshEndpoint] = useCurrentEndpoint()
	let isCurrentDevice = device.endpoint === currentEndpoint
	let [dropdownOpen, setDropdownOpen] = useState(false)
	let [editDrawerOpen, setEditDrawerOpen] = useState(false)
	let [editName, setEditName] = useState(device.deviceName)

	return (
		<div
			className={cn(
				"flex items-start justify-between py-4 transition-all",
				(dropdownOpen || editDrawerOpen) && "bg-accent -mx-1 rounded-md px-1",
			)}
		>
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} modal>
				<DropdownMenuTrigger
					onPointerDown={e => {
						if (e.pointerType === "touch") {
							e.preventDefault()
						}
					}}
					onClick={() => setDropdownOpen(true)}
				>
					<div className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
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
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center">
					<DropdownMenuItem
						onClick={() =>
							handleToggleDeviceEnabled(
								device,
								isCurrentDevice,
								notifications,
								t,
							)
						}
					>
						{device.isEnabled ? (
							<T k="notifications.devices.disable" />
						) : (
							<T k="notifications.devices.enable" />
						)}
						<Power />
					</DropdownMenuItem>
					{device.isEnabled && (
						<DropdownMenuItem
							onClick={() => handleSendTestNotification(device.endpoint, me, t)}
						>
							<T k="notifications.devices.sendTest" />
							<BellFill />
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => setEditDrawerOpen(true)}>
						<T k="notifications.devices.editName" />
						<PencilSquare />
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() =>
							handleRemoveDevice(
								device.endpoint,
								isCurrentDevice,
								notifications,
								refreshEndpoint,
								t,
							)
						}
						variant="destructive"
					>
						<T k="notifications.devices.remove" />
						<Trash />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="notifications.devices.editDrawer.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="notifications.devices.editDrawer.description" />
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							value={editName}
							onChange={e => setEditName(e.target.value)}
							placeholder=""
							onKeyDown={e => {
								if (e.key === "Enter") {
									handleSaveDeviceName(
										device.endpoint,
										editName,
										notifications,
										() => setEditDrawerOpen(false),
										t,
									)
								}
								if (e.key === "Escape") {
									setEditName(device.deviceName)
									setEditDrawerOpen(false)
								}
							}}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setEditName(device.deviceName)
								setEditDrawerOpen(false)
							}}
						>
							<T k="common.cancel" />
						</Button>
						<Button
							onClick={() =>
								handleSaveDeviceName(
									device.endpoint,
									editName,
									notifications,
									() => setEditDrawerOpen(false),
									t,
								)
							}
							disabled={!editName.trim()}
						>
							<T k="common.save" />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
