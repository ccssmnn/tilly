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
import { UserAccount, extractHashtags } from "#shared/schema/user"

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
	let [newHashtag, setNewHashtag] = useState(hashtag || "")
	let [isLoading, setIsLoading] = useState(false)

	let me = useAccount(UserAccount)

	let peopleInList = hashtag
		? people.filter(p => {
				let tags = extractHashtags(p.summary)
				return tags.includes(hashtag.toLowerCase())
			})
		: []

	let handleRemovePerson = async (personId: string) => {
		if (!me.$isLoaded) return
		setIsLoading(true)
		try {
			let person = people.find(p => p.$jazz.id === personId)
			if (!person) return

			let tags = extractHashtags(person.summary)
			let filteredTags = tags.filter(tag => tag !== hashtag?.toLowerCase())
			let newSummary = filteredTags.join(" ")

			await updatePerson(personId, { summary: newSummary }, me)
		} finally {
			setIsLoading(false)
		}
	}

	let handleAddPerson = async (personId: string) => {
		if (!me.$isLoaded || !newHashtag.trim()) return
		setIsLoading(true)
		try {
			let person = people.find(p => p.$jazz.id === personId)
			if (!person) return

			let currentSummary = person.summary || ""
			let hashtag = `#${newHashtag.toLowerCase().replace(/[^a-z0-9_]/g, "")}`
			let newSummary = `${currentSummary} ${hashtag}`.trim()

			await updatePerson(personId, { summary: newSummary }, me)
		} finally {
			setIsLoading(false)
		}
	}

	let handleRename = async () => {
		if (!me.$isLoaded || !hashtag || !newHashtag.trim()) return
		setIsLoading(true)
		try {
			let oldTag = hashtag.toLowerCase()
			let newTag = `#${newHashtag.toLowerCase().replace(/[^a-z0-9_]/g, "")}`

			for (let person of peopleInList) {
				let tags = extractHashtags(person.summary)
				let filteredTags = tags.filter(tag => tag !== oldTag)
				let updatedTags = [...filteredTags, newTag]
				let newSummary = updatedTags.join(" ").trim()

				await updatePerson(person.$jazz.id, { summary: newSummary }, me)
			}

			setNewHashtag("")
			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	let handleDeleteList = async () => {
		if (!me.$isLoaded || !hashtag) return
		if (!confirm("Delete this list and remove it from all people?")) return

		setIsLoading(true)
		try {
			for (let person of peopleInList) {
				let tags = extractHashtags(person.summary)
				let filteredTags = tags.filter(tag => tag !== hashtag.toLowerCase())
				let newSummary = filteredTags.join(" ").trim()

				await updatePerson(person.$jazz.id, { summary: newSummary }, me)
			}

			onOpenChange(false)
		} finally {
			setIsLoading(false)
		}
	}

	let peopleNotInList = people.filter(
		p => !peopleInList.find(pl => pl.$jazz.id === p.$jazz.id),
	)

	let hasChanges = newHashtag !== hashtag

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md"
				titleSlot={
					<DialogHeader>
						<DialogTitle>Edit list {hashtag}</DialogTitle>
						<DialogDescription>
							Manage people in this list and rename it
						</DialogDescription>
					</DialogHeader>
				}
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="new-hashtag" className="text-sm font-medium">
							List name
						</label>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">#</span>
							<Input
								id="new-hashtag"
								placeholder="family"
								value={newHashtag}
								onChange={e => setNewHashtag(e.target.value)}
								disabled={isLoading}
								className="flex-1"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							People ({peopleInList.length})
						</label>
						<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
							{peopleInList.length === 0 ? (
								<p className="text-muted-foreground py-2 text-xs">
									No people in this list
								</p>
							) : (
								peopleInList.map(person => (
									<div
										key={person.$jazz.id}
										className="hover:bg-accent flex items-center justify-between rounded p-2"
									>
										<span className="text-sm">{person.name}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemovePerson(person.$jazz.id)}
											disabled={isLoading}
										>
											Remove
										</Button>
									</div>
								))
							)}
						</div>
					</div>

					{peopleNotInList.length > 0 && (
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Add people ({peopleNotInList.length})
							</label>
							<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
								{peopleNotInList.map(person => (
									<div
										key={person.$jazz.id}
										className="hover:bg-accent flex items-center justify-between rounded p-2"
									>
										<span className="text-sm">{person.name}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleAddPerson(person.$jazz.id)}
											disabled={isLoading}
										>
											Add
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="flex justify-between gap-2 pt-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDeleteList}
							disabled={isLoading}
						>
							Delete list
						</Button>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
							>
								Close
							</Button>
							<Button
								onClick={handleRename}
								disabled={!hasChanges || isLoading}
							>
								{isLoading ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
