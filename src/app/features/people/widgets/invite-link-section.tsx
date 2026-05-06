import { useState } from "react"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Person, UserAccount } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { co } from "jazz-tools"
import { useAccount } from "jazz-tools/react"
import { Clipboard, Check } from "react-bootstrap-icons"
import { PlatformShareIcon } from "../parts/platform-share-icon"
import { createPersonInviteLink } from "../lib/person-sharing"

export { InviteLinkSection }

type LoadedPerson = co.loaded<
	typeof Person,
	{
		notes: { $each: { $onError: "catch" } }
		reminders: { $each: { $onError: "catch" } }
	}
>

let fullResolve = {
	notes: { $each: { $onError: "catch" } },
	reminders: { $each: { $onError: "catch" } },
	inactiveNotes: { $each: { $onError: "catch" } },
	inactiveReminders: { $each: { $onError: "catch" } },
} as const

function InviteLinkSection({
	person,
	hasPlusAccess,
	onLinkGenerated,
}: {
	person: LoadedPerson
	hasPlusAccess: boolean
	onLinkGenerated: () => void
}) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [inviteLink, setInviteLink] = useState("")
	let [isGenerating, setIsGenerating] = useState(false)
	let [isCopied, setIsCopied] = useState(false)

	let hasNativeShare = typeof navigator !== "undefined" && "share" in navigator

	async function handleGenerateLink() {
		if (!me.$isLoaded) return

		setIsGenerating(true)

		let fullPerson = await Person.load(person.$jazz.id, {
			resolve: fullResolve,
		})
		if (!fullPerson.$isLoaded) {
			setIsGenerating(false)
			toast.error(t("invite.error.failed"))
			return
		}

		let result = await tryCatch(createPersonInviteLink(fullPerson, me.$jazz.id))
		setIsGenerating(false)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setInviteLink(result.data)
		onLinkGenerated()
	}

	async function handleCopyLink() {
		if (!inviteLink) return

		await navigator.clipboard.writeText(inviteLink)
		setIsCopied(true)
		toast.success(t("person.share.inviteLink.copied"))
		setTimeout(() => setIsCopied(false), 2000)
	}

	async function handleNativeShare() {
		if (!inviteLink) return

		if (typeof navigator.share === "function") {
			await navigator.share({
				title: t("person.share.dialog.title", { name: person.name }),
				url: inviteLink,
			})
		}
	}

	return (
		<div className="space-y-3">
			<label className="text-sm font-medium">
				<T k="person.share.inviteLink.label" />
			</label>
			{inviteLink ? (
				<div className="flex gap-2">
					<Input value={inviteLink} readOnly className="font-mono text-xs" />
					<Button
						variant="secondary"
						size="icon"
						onClick={handleCopyLink}
						aria-label={t("person.share.inviteLink.copy")}
					>
						{isCopied ? <Check /> : <Clipboard />}
					</Button>
					{hasNativeShare && (
						<Button
							variant="secondary"
							size="icon"
							onClick={handleNativeShare}
							aria-label={t("person.share.inviteLink.share")}
						>
							<PlatformShareIcon />
						</Button>
					)}
				</div>
			) : (
				<Button
					onClick={handleGenerateLink}
					disabled={isGenerating || !hasPlusAccess}
					className="w-full"
				>
					{isGenerating ? (
						<T k="common.loading" />
					) : !hasPlusAccess ? (
						<T k="person.share.requiresPlus" />
					) : (
						<T k="person.share.inviteLink.generate" />
					)}
				</Button>
			)}
		</div>
	)
}
