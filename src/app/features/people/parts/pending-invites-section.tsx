import { useState } from "react"
import { Button } from "#shared/ui/button"
import { Person } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { co, Group, type ID } from "jazz-tools"
import { X, Link45deg } from "react-bootstrap-icons"
import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import {
	removeInviteGroup,
	type PendingInviteGroup,
} from "../lib/person-sharing"

export { PendingInvitesSection }

type LoadedPerson = co.loaded<
	typeof Person,
	{
		notes: { $each: { $onError: "catch" } }
		reminders: { $each: { $onError: "catch" } }
	}
>

function PendingInvitesSection({
	person,
	pendingInvites,
	isLoading,
	onInviteCancelled,
}: {
	person: LoadedPerson
	pendingInvites: PendingInviteGroup[]
	isLoading: boolean
	onInviteCancelled: (groupId: string) => void
}) {
	let t = useIntl()
	let locale = useLocale()
	let [cancellingInviteId, setCancellingInviteId] = useState<string | null>(
		null,
	)

	function handleCancelPendingInvite(groupId: string) {
		setCancellingInviteId(groupId)

		let result = tryCatch(() => removeInviteGroup(person, groupId as ID<Group>))
		setCancellingInviteId(null)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		toast.success(t("person.share.pending.cancelSuccess"))
		onInviteCancelled(groupId)
	}

	return (
		<div className="space-y-3">
			<label className="text-sm font-medium">
				<T k="person.share.pending.title" />
			</label>
			{isLoading ? (
				<p className="text-muted-foreground text-sm">
					<T k="common.loading" />
				</p>
			) : pendingInvites.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					<T k="person.share.pending.empty" />
				</p>
			) : (
				<ul className="space-y-2">
					{pendingInvites.map(invite => (
						<li
							key={invite.groupId}
							className="flex items-center justify-between gap-2"
						>
							<div className="flex items-center gap-2">
								<Link45deg className="text-muted-foreground" />
								<span className="text-muted-foreground text-sm">
									{t("person.share.pending.createdAt", {
										ago: formatDistanceToNow(invite.createdAt, {
											addSuffix: true,
											locale: locale === "de" ? dfnsDe : undefined,
										}),
									})}
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleCancelPendingInvite(invite.groupId)}
								disabled={cancellingInviteId === invite.groupId}
							>
								<X />
								<T k="person.share.pending.cancel" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
