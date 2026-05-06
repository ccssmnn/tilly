import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { Plus, X } from "react-bootstrap-icons"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { updatePerson } from "#shared/tools/person-update"
import { extractHashtags } from "../lib/list-utilities"
import { NewListDialog } from "../widgets/new-list-dialog"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"

export { ManageListsDialog }

function ManageListsDialog({
	open,
	onOpenChange,
	personId,
	personName,
	personSummary,
	allPeople,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	personId: string
	personName: string
	personSummary?: string
	allPeople: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
}) {
	let [isLoading, setIsLoading] = useState(false)
	let [isNewListDialogOpen, setIsNewListDialogOpen] = useState(false)
	let me = useAccount(UserAccount)
	let t = useIntl()

	let existingLists = Array.from(
		new Set(
			allPeople
				.flatMap(p => extractHashtags(p.summary))
				.map(tag => tag.substring(1)),
		),
	).sort()

	let personLists = extractHashtags(personSummary).map(tag => tag.substring(1))

	async function handleAddToList(listName: string) {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${listName.toLowerCase()}`
			let currentSummary = personSummary || ""
			let newSummary = `${currentSummary} ${hashtag}`.trim()

			await updatePerson(personId, { summary: newSummary }, me)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleRemoveFromList(listName: string) {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${listName.toLowerCase()}`
			let currentSummary = personSummary || ""
			let newSummary = currentSummary
				.split(/\s+/)
				.filter((word: string) => word !== hashtag)
				.join(" ")
				.trim()

			await updatePerson(personId, { summary: newSummary }, me)
		} finally {
			setIsLoading(false)
		}
	}

	function handleListCreated(hashtag: string) {
		setIsNewListDialogOpen(false)
		toast.success(t("person.manageLists.toast.created", { listName: hashtag }))
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="person.manageLists.title" />
						</DialogTitle>
						<DialogDescription>
							{t("person.manageLists.description", { name: personName })}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{existingLists.length > 0 && (
							<ul className="space-y-2">
								{existingLists.map(listName => {
									let isInList = personLists.includes(listName)
									return (
										<li
											key={listName}
											className="flex items-center justify-between gap-2"
										>
											<span className="text-sm">#{listName}</span>
											<Button
												size="sm"
												variant={isInList ? "destructive" : "default"}
												onClick={() => {
													if (isInList) {
														handleRemoveFromList(listName)
													} else {
														handleAddToList(listName)
													}
												}}
												disabled={isLoading}
											>
												{isInList ? (
													<>
														<X className="mr-1 h-3 w-3" />
														Remove
													</>
												) : (
													<>
														<Plus className="mr-1 h-3 w-3" />
														<T k="common.add" />
													</>
												)}
											</Button>
										</li>
									)
								})}
							</ul>
						)}
						<Button
							onClick={() => setIsNewListDialogOpen(true)}
							disabled={isLoading}
							className="w-full"
						>
							<T k="person.manageLists.createList" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
			<NewListDialog
				open={isNewListDialogOpen}
				onOpenChange={setIsNewListDialogOpen}
				people={allPeople}
				onListCreated={handleListCreated}
				defaultSelectedPeople={new Set([personId])}
			/>
		</>
	)
}
