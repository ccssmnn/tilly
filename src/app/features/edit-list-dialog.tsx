import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#shared/ui/alert-dialog"
import { updatePerson } from "#shared/tools/person-update"
import { useAccount } from "jazz-tools/react"
import { UserAccount, extractHashtags } from "#shared/schema/user"
import { ListForm } from "#app/features/list-form"

export { EditListDialog }

function EditListDialog({
	open,
	onOpenChange,
	hashtag,
	people,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	hashtag: string | null
	people: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
}) {
	let [isLoading, setIsLoading] = useState(false)
	let [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
	let me = useAccount(UserAccount)

	let peopleInList = hashtag
		? people.filter(p => {
				let tags = extractHashtags(p.summary)
				return tags.includes(hashtag.toLowerCase())
			})
		: []

	let initialSelectedPeople = new Set(peopleInList.map(p => p.$jazz.id))
	let initialListName = hashtag ? hashtag.substring(1) : ""

	let handleSave = async (values: {
		listName: string
		selectedPeople: Set<string>
	}) => {
		if (!me.$isLoaded || !hashtag) return

		setIsLoading(true)
		try {
			let oldTag = hashtag.toLowerCase()
			let newTag = `#${values.listName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`

			let peopleToRemoveFrom = peopleInList.filter(
				p => !values.selectedPeople.has(p.$jazz.id),
			)
			let peopleToAddTo = [...values.selectedPeople].filter(
				id => !initialSelectedPeople.has(id),
			)

			for (let person of peopleToRemoveFrom) {
				let tags = extractHashtags(person.summary)
				let filteredTags = tags.filter(tag => tag !== oldTag)
				let newSummary = filteredTags.join(" ").trim()
				await updatePerson(person.$jazz.id, { summary: newSummary }, me)
			}

			for (let personId of peopleToAddTo) {
				let person = people.find(p => p.$jazz.id === personId)
				if (!person) continue

				let tags = extractHashtags(person.summary)
				let filteredTags = tags.filter(tag => tag !== oldTag)
				let updatedTags = [...filteredTags, newTag]
				let newSummary = updatedTags.join(" ").trim()

				await updatePerson(personId, { summary: newSummary }, me)
			}

			for (let person of peopleInList.filter(p =>
				values.selectedPeople.has(p.$jazz.id),
			)) {
				if (oldTag !== newTag) {
					let tags = extractHashtags(person.summary)
					let filteredTags = tags.filter(tag => tag !== oldTag)
					let updatedTags = [...filteredTags, newTag]
					let newSummary = updatedTags.join(" ").trim()

					await updatePerson(person.$jazz.id, { summary: newSummary }, me)
				}
			}

			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	let handleDeleteConfirm = async () => {
		if (!me.$isLoaded || !hashtag) return

		setIsLoading(true)
		try {
			let oldTag = hashtag.toLowerCase()

			for (let person of peopleInList) {
				let tags = extractHashtags(person.summary)
				let filteredTags = tags.filter(tag => tag !== oldTag)
				let newSummary = filteredTags.join(" ").trim()

				await updatePerson(person.$jazz.id, { summary: newSummary }, me)
			}

			setIsDeleteConfirmOpen(false)
			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-[80vh] overflow-y-auto sm:max-w-md"
				titleSlot={
					<DialogHeader>
						<DialogTitle>Edit list {hashtag}</DialogTitle>
						<DialogDescription>
							Manage people in this list and rename it
						</DialogDescription>
					</DialogHeader>
				}
			>
				<ListForm
					defaultListName={initialListName}
					defaultSelectedPeople={initialSelectedPeople}
					onSubmit={handleSave}
					onCancel={() => onOpenChange(false)}
					onDelete={() => setIsDeleteConfirmOpen(true)}
					isLoading={isLoading}
					mode="edit"
				/>
				<AlertDialog
					open={isDeleteConfirmOpen}
					onOpenChange={setIsDeleteConfirmOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete list {hashtag}</AlertDialogTitle>
							<AlertDialogDescription>
								This will remove {hashtag} from {peopleInList.length} person
								{peopleInList.length !== 1 ? "s" : ""}. This action cannot be
								undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDeleteConfirm}
								disabled={isLoading}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</DialogContent>
		</Dialog>
	)
}
