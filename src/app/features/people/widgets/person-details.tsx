import { Image as JazzImage } from "jazz-tools/react"
import { co } from "jazz-tools"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Button } from "#shared/ui/button"
import { Badge } from "#shared/ui/badge"
import { Person, UserAccount } from "#shared/schema/user"
import { isTextSelectionOngoing } from "#app/lib/utils"
import { T, useIntl } from "#shared/intl/setup"
import { useCollaborators } from "#app/hooks/use-collaborators"
import { useState, useEffect } from "react"
import { ActionsDropdown } from "./actions-dropdown"
import {
	CreatedAtTimestamp,
	UpdatedAtTimestamp,
} from "../parts/person-timestamps"
import { SharedWithBadge } from "../parts/shared-with-badge"
import { isPersonAdmin, getPersonOwnerName } from "../lib/person-utils"
import { testIds } from "#shared/lib/test-ids"

export { PersonDetails }

type Query = {
	avatar: true
	notes: { $each: { $onError: "catch" } }
	reminders: { $each: { $onError: "catch" } }
}

function PersonDetails({
	person,
	me,
}: {
	person: co.loaded<typeof Person, Query>
	me: co.loaded<typeof UserAccount>
}) {
	let t = useIntl()
	let isAdmin = isPersonAdmin(person)
	let isShared = !isAdmin
	let [ownerName, setOwnerName] = useState<string | null>(null)
	let { collaborators: allCollaborators } = useCollaborators(person)
	let collaborators = allCollaborators.filter(c => c.role !== "admin")

	useEffect(() => {
		if (!isShared) return
		getPersonOwnerName(person).then(setOwnerName)
	}, [person, isShared])

	return (
		<>
			<div className="flex flex-col items-center gap-6 md:flex-row">
				<ActionsDropdown person={person} me={me}>
					<Avatar
						className="size-48 cursor-pointer"
						onClick={e => {
							if (isTextSelectionOngoing()) {
								e.preventDefault()
								return
							}
						}}
					>
						{person.avatar ? (
							<JazzImage
								imageId={person.avatar.$jazz.id}
								alt={person.name}
								width={192}
								data-slot="avatar-image"
								className="aspect-square size-full object-cover shadow-inner"
							/>
						) : (
							<AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
						)}
					</Avatar>
				</ActionsDropdown>
				<div className="w-full flex-1 md:w-auto">
					<div className="flex items-center justify-between gap-3">
						<h1
							className="text-3xl font-bold select-text"
							data-testid={testIds.person.detailName}
						>
							{person.name}
						</h1>
						<ActionsDropdown person={person} me={me}>
							<Button
								variant="secondary"
								size="sm"
								data-testid={testIds.person.actionsTrigger}
							>
								<T k="person.actions.title" />
							</Button>
						</ActionsDropdown>
					</div>
					{person.summary && (
						<p
							className="text-muted-foreground my-3 select-text"
							data-testid={testIds.person.detailSummary}
						>
							{person.summary.split(/(#[a-zA-Z0-9_]+)/).map((part, i) =>
								part.startsWith("#") ? (
									<span key={i} className="text-primary font-bold">
										{part}
									</span>
								) : (
									part
								),
							)}
						</p>
					)}

					{isShared && ownerName && (
						<Badge variant="secondary" className="mb-2">
							{t("person.shared.sharedBy", { name: ownerName })}
						</Badge>
					)}
					{isAdmin && collaborators.length > 0 && (
						<SharedWithBadge collaborators={collaborators} />
					)}
					<p className="text-muted-foreground space-y-1 text-sm select-text">
						<CreatedAtTimestamp value={person} />
						<UpdatedAtTimestamp value={person} />
					</p>
				</div>
			</div>
		</>
	)
}
