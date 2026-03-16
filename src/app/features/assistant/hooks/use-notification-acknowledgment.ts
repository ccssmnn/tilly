import { useEffect } from "react"
import type { co } from "jazz-tools"
import type { Assistant } from "#shared/schema/user"

export { useNotificationAcknowledgment }

function useNotificationAcknowledgment(
	assistant: co.loaded<typeof Assistant> | undefined,
) {
	useEffect(() => {
		if (!assistant) return

		let unsubscribe = assistant.$jazz.subscribe(
			(a: co.loaded<typeof Assistant>) => {
				if (document.visibilityState !== "visible") return
				if (!a.notificationCheckId) return
				if (a.notificationCheckId === a.notificationAcknowledgedId) return
				a.$jazz.set("notificationAcknowledgedId", a.notificationCheckId)
			},
		)

		return unsubscribe
	}, [assistant])
}
