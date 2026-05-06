import { Badge } from "#shared/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "#shared/ui/tooltip"
import { useIntl } from "#shared/intl/setup"
import type { Collaborator } from "#app/hooks/use-collaborators"

export { SharedWithBadge }

function SharedWithBadge({ collaborators }: { collaborators: Collaborator[] }) {
	let t = useIntl()
	let names = collaborators.map(c => c.name)

	if (collaborators.length === 1) {
		return (
			<Badge variant="secondary" className="mb-2">
				{t("person.shared.sharedWith", { name: names[0] })}
			</Badge>
		)
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Badge variant="secondary" className="mb-2 cursor-default">
						{t("person.shared.sharedWithCount", {
							count: collaborators.length,
						})}
					</Badge>
				}
			/>
			<TooltipContent>
				<p>{names.join(", ")}</p>
			</TooltipContent>
		</Tooltip>
	)
}
