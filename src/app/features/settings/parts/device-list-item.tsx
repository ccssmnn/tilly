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
	currentEndpoint: string | null | undefined
	refreshEndpoint: () => void
	onToggleEnabled: (
		device: DeviceListItemProps["device"],
		isCurrentDevice: boolean,
		notifications: DeviceListItemProps["me"]["root"]["notificationSettings"],
		t: ReturnType<typeof useIntl>,
	) => void
	onSendTest: (
		endpoint: string,
		me: co.loaded<typeof UserAccount, NotificationQuery>,
		t: ReturnType<typeof useIntl>,
	) => void
	onRemove: (
		endpoint: string,
		isCurrentDevice: boolean,
		notifications: DeviceListItemProps["me"]["root"]["notificationSettings"],
		refreshEndpoint: () => void,
		t: ReturnType<typeof useIntl>,
	) => void
	onSaveName: (
		endpoint: string,
		editName: string,
		notifications: DeviceListItemProps["me"]["root"]["notificationSettings"],
		onClose: () => void,
		t: ReturnType<typeof useIntl>,
	) => void
}

function DeviceListItem({
	device,
	me,
	currentEndpoint,
	refreshEndpoint,
	onToggleEnabled,
	onSendTest,
	onRemove,
	onSaveName,
}: DeviceListItemProps) {
	let t = useIntl()
	let notifications = me?.root.notificationSettings
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
					className="min-w-0 flex-1 text-left"
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
				<DropdownMenuContent align="center" className="w-auto min-w-0">
					<DropdownMenuItem
						onClick={() =>
							onToggleEnabled(device, isCurrentDevice, notifications, t)
						}
					>
						<Power />
						{device.isEnabled ? (
							<T k="notifications.devices.disable" />
						) : (
							<T k="notifications.devices.enable" />
						)}
					</DropdownMenuItem>
					{device.isEnabled && (
						<DropdownMenuItem
							onClick={() => onSendTest(device.endpoint, me, t)}
						>
							<BellFill />
							<T k="notifications.devices.sendTest" />
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => setEditDrawerOpen(true)}>
						<PencilSquare />
						<T k="notifications.devices.editName" />
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() =>
							onRemove(
								device.endpoint,
								isCurrentDevice,
								notifications,
								refreshEndpoint,
								t,
							)
						}
						variant="destructive"
					>
						<Trash />
						<T k="notifications.devices.remove" />
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
									onSaveName(
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
								onSaveName(
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
