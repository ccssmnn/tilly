import { useState } from "react"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
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
import { cn } from "#app/lib/utils"

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
	let [listName, setListName] = useState("")
	let [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
	let [isLoading, setIsLoading] = useState(false)

	let me = useAccount(UserAccount)

	let handleTogglePerson = (personId: string) => {
		let newSet = new Set(selectedPeople)
		if (newSet.has(personId)) {
			newSet.delete(personId)
		} else {
			newSet.add(personId)
		}
		setSelectedPeople(newSet)
	}

	let handleCreate = async () => {
		if (!listName.trim() || selectedPeople.size === 0) return
		if (!me.$isLoaded) return

		setIsLoading(true)
		try {
			let hashtag = `#${listName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`

			for (let personId of selectedPeople) {
				let person = people.find(p => p.$jazz.id === personId)
				if (!person) continue

				let currentSummary = person.summary || ""
				let newSummary = `${currentSummary} ${hashtag}`.trim()

				await updatePerson(personId, { summary: newSummary }, me)
			}

			setListName("")
			setSelectedPeople(new Set())
			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	let isValid = listName.trim().length > 0 && selectedPeople.size > 0

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md"
				titleSlot={
					<DialogHeader>
						<DialogTitle>Create new list</DialogTitle>
						<DialogDescription>
							Create a hashtag-based list and add people to it
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="list-name" className="text-sm font-medium">
							List name
						</label>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">#</span>
							<Input
								id="list-name"
								placeholder="family"
								value={listName}
								onChange={e => setListName(e.target.value)}
								disabled={isLoading}
								className="flex-1"
							/>
						</div>
						<p className="text-muted-foreground text-xs">
							List names are lowercase alphanumeric and underscores
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">People to add</label>
						<div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-4">
							{people.map(person => (
								<div
									key={person.$jazz.id}
									className="hover:bg-accent flex items-center gap-3 rounded p-2"
								>
									<input
										type="checkbox"
										id={`person-${person.$jazz.id}`}
										checked={selectedPeople.has(person.$jazz.id)}
										onChange={() => handleTogglePerson(person.$jazz.id)}
										disabled={isLoading}
										className="cursor-pointer rounded"
									/>
									<label
										htmlFor={`person-${person.$jazz.id}`}
										className={cn(
											"flex-1 cursor-pointer text-sm",
											isLoading && "opacity-50",
										)}
									>
										{person.name}
									</label>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button onClick={handleCreate} disabled={!isValid || isLoading}>
							{isLoading ? "Creating..." : "Create"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
