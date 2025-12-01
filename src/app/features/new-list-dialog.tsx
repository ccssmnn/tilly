import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { updatePerson } from "#shared/tools/person-update"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { ListForm } from "#app/features/list-form"
import { T } from "#shared/intl/setup"

export { NewListDialog }

function NewListDialog({
	open,
	onOpenChange,
	people,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	people: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
}) {
	let [isLoading, setIsLoading] = useState(false)
	let me = useAccount(UserAccount)

	let handleCreate = async (values: {
		listName: string
		selectedPeople: Set<string>
	}) => {
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${values.listName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`

			for (let personId of values.selectedPeople) {
				let person = people.find(p => p.$jazz.id === personId)
				if (!person) continue

				let currentSummary = person.summary || ""
				let newSummary = `${currentSummary} ${hashtag}`.trim()

				await updatePerson(personId, { summary: newSummary }, me)
			}

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
						<DialogTitle>
							<T k="person.newList.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="person.newList.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<ListForm
					defaultListName=""
					defaultSelectedPeople={new Set()}
					onSubmit={handleCreate}
					isLoading={isLoading}
					mode="create"
				/>
			</DialogContent>
		</Dialog>
	)
}
