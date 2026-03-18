import type { co } from "jazz-tools"
import type { UserAccount } from "#shared/schema/user"

export type { NotificationQuery, NotificationSettingsType }

type NotificationQuery = {
	root: { notificationSettings: true }
}

type NotificationSettingsType = NonNullable<
	co.loaded<
		typeof UserAccount,
		NotificationQuery
	>["root"]["notificationSettings"]
>
