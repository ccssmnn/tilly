import { useState } from "react"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "#shared/ui/drawer"
import { updatePerson } from "#shared/tools/person-update"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { ListForm } from "#app/features/list-form"
import { T } from "#shared/intl/setup"
import { addHashtagToSummary } from "#app/features/list-utilities"

export { NewListDrawer as NewListDialog }

function NewListDrawer({
	open,
	onOpenChange,
	people,
	onListCreated,
	defaultSelectedPeople,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	people: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
	onListCreated?: (hashtag: string) => void
	defaultSelectedPeople?: Set<string>
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

				let newSummary = addHashtagToSummary(person.summary, hashtag)

				await updatePerson(personId, { summary: newSummary }, me)
			}

			onListCreated?.(hashtag)
			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>
						<T k="person.newList.title" />
					</DrawerTitle>
					<DrawerDescription>
						<T k="person.newList.description" />
					</DrawerDescription>
				</DrawerHeader>
				<ListForm
					defaultListName=""
					defaultSelectedPeople={defaultSelectedPeople || new Set()}
					onSubmit={handleCreate}
					isLoading={isLoading}
					mode="create"
				/>
			</DrawerContent>
		</Drawer>
	)
}
