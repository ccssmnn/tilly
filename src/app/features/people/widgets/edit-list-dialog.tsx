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
import { UserAccount } from "#shared/schema/user"
import {
	extractHashtags,
	removeHashtagFromSummary,
} from "../lib/list-utilities"
import {
	removeTagFromDeselectedPeople,
	addTagToNewlySelectedPeople,
	renameTagForRemainingPeople,
	normalizeHashtag,
} from "../lib/list-operations"
import { ListForm } from "./list-form"
import { T } from "#shared/intl/setup"

export { EditListDrawer as EditListDialog }

function EditListDrawer({
	open,
	onOpenChange,
	hashtag,
	people,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	hashtag: string
	people: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
}) {
	let [isLoading, setIsLoading] = useState(false)
	let [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
	let me = useAccount(UserAccount)

	let peopleInList = people.filter(p => {
		let tags = extractHashtags(p.summary)
		return tags.includes(hashtag.toLowerCase())
	})

	let initialSelectedPeople = new Set(peopleInList.map(p => p.$jazz.id))
	let initialListName = hashtag.substring(1)

	async function saveChanges(values: {
		listName: string
		selectedPeople: Set<string>
	}) {
		if (!me.$isLoaded || !hashtag) return

		setIsLoading(true)
		try {
			let oldTag = hashtag.toLowerCase()
			let newTag = normalizeHashtag(values.listName)

			await removeTagFromDeselectedPeople({
				oldTag,
				selectedPeople: values.selectedPeople,
				peopleInList,
				me,
			})
			await addTagToNewlySelectedPeople({
				oldTag,
				newTag,
				selectedPeople: values.selectedPeople,
				initialSelectedPeople,
				allPeople: people,
				me,
			})

			if (oldTag !== newTag) {
				await renameTagForRemainingPeople({
					oldTag,
					newTag,
					selectedPeople: values.selectedPeople,
					peopleInList,
					me,
				})
			}

			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	async function deleteList() {
		if (!me.$isLoaded || !hashtag) return

		setIsLoading(true)
		try {
			let oldTag = hashtag.toLowerCase()

			for (let person of peopleInList) {
				let newSummary = removeHashtagFromSummary(person.summary, oldTag)
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
			<DialogContent className="max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						<T k="person.editList.title" params={{ hashtag }} />
					</DialogTitle>
					<DialogDescription>
						<T k="person.editList.description" />
					</DialogDescription>
				</DialogHeader>
				<ListForm
					defaultListName={initialListName}
					defaultSelectedPeople={initialSelectedPeople}
					onSubmit={saveChanges}
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
							<AlertDialogTitle>
								<T
									k="person.editList.deleteConfirm.title"
									params={{ hashtag }}
								/>
							</AlertDialogTitle>
							<AlertDialogDescription>
								<T
									k="person.editList.deleteConfirm.description"
									params={{
										hashtag,
										count: peopleInList.length,
									}}
								/>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								<T k="person.listForm.cancel" />
							</AlertDialogCancel>
							<AlertDialogAction onClick={deleteList} disabled={isLoading}>
								<T k="person.editList.deleteConfirm.delete" />
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</DialogContent>
		</Dialog>
	)
}
