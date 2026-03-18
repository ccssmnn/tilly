import { useIsAuthenticated } from "jazz-tools/react"
import type { co } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"
import { Alert, AlertTitle, AlertDescription } from "#shared/ui/alert"
import { ExclamationTriangle } from "react-bootstrap-icons"
import { T, useIntl } from "#shared/intl/setup"
import { isInAppBrowser } from "#app/hooks/use-pwa"
import { useCurrentEndpoint } from "../hooks/use-current-endpoint"
import { getBrowserRecommendation } from "../lib/device"
import type { NotificationQuery } from "../lib/notification-types"
import { TimezoneSection } from "../parts/timezone-section"
import { NotificationTimeSection } from "../parts/notification-time-section"
import { LastDeliveredSection } from "../parts/last-delivered-section"
import { DeviceListItem } from "../parts/device-list-item"
import { AddDeviceDrawer } from "../parts/add-device-drawer"

export { NotificationSection }

function NotificationSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, NotificationQuery>
}) {
	let t = useIntl()
	let isAuthenticated = useIsAuthenticated()

	let [currentEndpoint] = useCurrentEndpoint()

	let devices = me?.root.notificationSettings?.pushDevices || []
	let isCurrentDeviceAdded =
		currentEndpoint && devices.some(d => d.endpoint === currentEndpoint)

	let isServiceWorkerSupported = "serviceWorker" in navigator
	let isPushSupported = "PushManager" in window && "Notification" in window
	let canAddDevice = isServiceWorkerSupported && isPushSupported
	let browserRecommendation = getBrowserRecommendation(isInAppBrowser())

	return (
		<div className="grid grid-cols-1 gap-x-8 gap-y-6 py-8 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-y-4 md:py-8">
			<div className="space-y-1.5">
				<h2 className="text-xl/8 font-semibold sm:text-lg/7">
					{t("notifications.title")}
				</h2>
				<p className="text-muted-foreground text-sm/6">
					{t("notifications.description")}
				</p>
			</div>
			<div className="min-w-0 space-y-3">
				{!isAuthenticated && (
					<Alert>
						<ExclamationTriangle />
						<AlertTitle>
							<T k="notifications.signInRequired.title" />
						</AlertTitle>
					</Alert>
				)}
				{(!isServiceWorkerSupported || !isPushSupported) && (
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
								<AddDeviceDrawer me={me} disabled={!isAuthenticated} />
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
			</div>
		</div>
	)
}
