import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Person, UserAccount } from "#shared/schema/user"
import {
	createPersonInviteLink,
	getPersonCollaborators,
	removeCollaborator,
} from "#app/features/person-sharing"
import type { Collaborator } from "#app/features/person-sharing"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { co, type ID, type Account } from "jazz-tools"
import { useAccount } from "jazz-tools/react"
import { Clipboard, Check, Share, X, PersonFill } from "react-bootstrap-icons"

export { PersonShareDialog }

type LoadedPerson = co.loaded<
	typeof Person,
	{ notes: { $each: true }; reminders: { $each: true } }
>

let fullResolve = {
	notes: { $each: true },
	reminders: { $each: true },
	inactiveNotes: { $each: true },
	inactiveReminders: { $each: true },
} as const

function PersonShareDialog({
	open,
	onOpenChange,
	person,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	person: LoadedPerson
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{open && (
				<PersonShareDialogContent person={person} onOpenChange={onOpenChange} />
			)}
		</Dialog>
	)
}

function PersonShareDialogContent({
	person,
}: {
	person: LoadedPerson
	onOpenChange: (open: boolean) => void
}) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [inviteLink, setInviteLink] = useState<string | null>(null)
	let [isGenerating, setIsGenerating] = useState(false)
	let [isCopied, setIsCopied] = useState(false)
	let [collaborators, setCollaborators] = useState<Collaborator[]>([])
	let [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true)
	let [removingId, setRemovingId] = useState<string | null>(null)
	let [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		async function load() {
			let result = await tryCatch(getPersonCollaborators(person))
			setIsLoadingCollaborators(false)
			if (result.ok) {
				setCollaborators(result.data)
			}
		}
		load()
	}, [person, refreshKey])

	async function handleGenerateLink() {
		if (!me.$isLoaded) return

		setIsGenerating(true)

		// Load full person with inactive lists for migration check
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
		setRefreshKey(k => k + 1)
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

	async function handleRemoveCollaborator(collaborator: Collaborator) {
		setRemovingId(collaborator.id)
		let result = await tryCatch(
			removeCollaborator(person, collaborator.id as ID<Account>),
		)
		setRemovingId(null)

		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setCollaborators(prev => prev.filter(c => c.id !== collaborator.id))
	}

	let isAdmin = collaborators.some(
		c => c.id === me.$jazz.id && c.role === "admin",
	)
	let nonAdminCollaborators = collaborators.filter(c => c.role !== "admin")
	let hasNativeShare = typeof navigator !== "undefined" && "share" in navigator

	return (
		<DialogContent
			className="sm:max-w-md"
			titleSlot={
				<DialogHeader>
					<DialogTitle>
						<T k="person.share.dialog.title" params={{ name: person.name }} />
					</DialogTitle>
					<DialogDescription>
						<T k="person.share.dialog.description" />
					</DialogDescription>
				</DialogHeader>
			}
		>
			<div className="space-y-6">
				{/* Invite link section */}
				<div className="space-y-3">
					<label className="text-sm font-medium">
						<T k="person.share.inviteLink.label" />
					</label>
					{inviteLink ? (
						<div className="flex gap-2">
							<Input
								value={inviteLink}
								readOnly
								className="font-mono text-xs"
							/>
							<Button variant="secondary" size="icon" onClick={handleCopyLink}>
								{isCopied ? (
									<Check className="h-4 w-4" />
								) : (
									<Clipboard className="h-4 w-4" />
								)}
							</Button>
							{hasNativeShare && (
								<Button
									variant="secondary"
									size="icon"
									onClick={handleNativeShare}
								>
									<Share className="h-4 w-4" />
								</Button>
							)}
						</div>
					) : (
						<Button
							onClick={handleGenerateLink}
							disabled={isGenerating}
							className="w-full"
						>
							{isGenerating ? (
								<T k="common.loading" />
							) : (
								<T k="person.share.inviteLink.generate" />
							)}
						</Button>
					)}
				</div>

				{/* Collaborators section */}
				<div className="space-y-3">
					<label className="text-sm font-medium">
						<T k="person.share.collaborators.title" />
					</label>
					{isLoadingCollaborators ? (
						<p className="text-muted-foreground text-sm">
							<T k="common.loading" />
						</p>
					) : nonAdminCollaborators.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							<T k="person.share.collaborators.empty" />
						</p>
					) : (
						<ul className="space-y-2">
							{nonAdminCollaborators.map(collaborator => (
								<li
									key={collaborator.id}
									className="flex items-center justify-between gap-2"
								>
									<div className="flex items-center gap-2">
										<PersonFill className="text-muted-foreground h-4 w-4" />
										<span className="text-sm">{collaborator.name}</span>
									</div>
									{isAdmin && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveCollaborator(collaborator)}
											disabled={removingId === collaborator.id}
										>
											<X className="h-4 w-4" />
											<T k="person.share.collaborators.remove" />
										</Button>
									)}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</DialogContent>
	)
}
