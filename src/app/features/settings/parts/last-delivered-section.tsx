import { de as dfnsDe } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import type { co } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"
import { Button } from "#shared/ui/button"
import { DisplayField } from "#shared/ui/display-field"
import { T, useLocale } from "#shared/intl/setup"
import type { NotificationQuery } from "../lib/notification-types"

export { LastDeliveredSection }

function LastDeliveredSection({
	me,
}: {
	me: co.loaded<typeof UserAccount, NotificationQuery>
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
			<p className="text-sm font-medium">
				<T k="notifications.lastDelivery.label" />
			</p>
			<div className="flex items-center gap-2">
				<DisplayField
					value={
						notifications?.lastDeliveredAt
							? formatDistanceToNow(new Date(notifications.lastDeliveredAt), {
									addSuffix: true,
									locale: dfnsLocale,
								})
							: "-"
					}
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
