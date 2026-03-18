import { Badge } from "#shared/ui/badge"
import { PersonFill } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { type co } from "jazz-tools"
import { Note, Person, Reminder } from "#shared/schema/user"
import { getSharingStatus } from "#app/features/people/lib/sharing-status"

export { SharedIndicator }

function SharedIndicator({
	item,
}: {
	item:
		| co.loaded<typeof Person>
		| co.loaded<typeof Note>
		| co.loaded<typeof Reminder>
}) {
	let sharedStatus = getSharingStatus(item)
	if (sharedStatus === "none") return null
	return (
		<Badge variant="secondary">
			<PersonFill />
			{sharedStatus === "owner" ? (
				<T k="person.shared.indicator.owner.badge" />
			) : (
				<T k="person.shared.indicator.badge" />
			)}
		</Badge>
	)
}
