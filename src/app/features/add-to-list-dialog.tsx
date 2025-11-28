import { useState } from "react"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { updatePerson } from "#shared/tools/person-update"
import { useAccount } from "jazz-tools/react"
import { UserAccount, extractHashtags } from "#shared/schema/user"
import { ListForm } from "#app/features/list-form"
import { toast } from "sonner"
import { Check } from "react-bootstrap-icons"

export { AddToListDialog }

function AddToListDialog({
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
	let [showCreateForm, setShowCreateForm] = useState(false)
	let me = useAccount(UserAccount)

	let existingLists = Array.from(
		new Set(
			allPeople
				.flatMap(p => extractHashtags(p.summary))
				.map(tag => tag.substring(1)),
		),
	).sort()

	let personLists = extractHashtags(personSummary).map(tag => tag.substring(1))

	let handleAddToExistingList = async (listName: string) => {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${listName.toLowerCase()}`
			let currentSummary = personSummary || ""
			let newSummary = `${currentSummary} ${hashtag}`.trim()

			await updatePerson(personId, { summary: newSummary }, me)

			toast.success(`Added ${personName} to list #${listName}`)
			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	let handleCreateNewList = async (values: {
		listName: string
		selectedPeople: Set<string>
	}) => {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${values.listName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`

			for (let personIdToAdd of values.selectedPeople) {
				let person = allPeople.find(p => p.$jazz.id === personIdToAdd)
				if (!person) continue

				let currentSummary = person.summary || ""
				let newSummary = `${currentSummary} ${hashtag}`.trim()

				await updatePerson(personIdToAdd, { summary: newSummary }, me)
			}

			toast.success(`Created list #${values.listName}`)
			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md"
				titleSlot={
					<DialogHeader>
						<DialogTitle>Add to list</DialogTitle>
						<DialogDescription>
							Add {personName} to an existing list or create a new one
						</DialogDescription>
					</DialogHeader>
				}
			>
				{!showCreateForm ? (
					<div className="space-y-2">
						{existingLists.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm font-medium">Existing lists</p>
								<div className="grid gap-2">
									{existingLists.map(listName => {
										let isInList = personLists.includes(listName)
										return (
											<Button
												key={listName}
												variant="outline"
												onClick={() => handleAddToExistingList(listName)}
												disabled={isLoading || isInList}
												className="justify-start"
											>
												{isInList && <Check className="mr-2 h-4 w-4" />}#
												{listName}
											</Button>
										)
									})}
								</div>
								<div className="relative py-2">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background text-muted-foreground px-2">
											or
										</span>
									</div>
								</div>
							</div>
						)}
						<Button
							onClick={() => setShowCreateForm(true)}
							disabled={isLoading}
							className="w-full"
						>
							Create new list
						</Button>
					</div>
				) : (
					<ListForm
						defaultListName=""
						defaultSelectedPeople={new Set([personId])}
						onSubmit={handleCreateNewList}
						onCancel={() => setShowCreateForm(false)}
						isLoading={isLoading}
						mode="create"
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
