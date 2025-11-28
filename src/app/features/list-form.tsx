import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import { useMemo } from "react"
import { Check } from "react-bootstrap-icons"
import { useState } from "react"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"

export { ListForm }

function ListForm(props: {
	defaultListName: string
	defaultSelectedPeople: Set<string>
	onSubmit: (values: { listName: string; selectedPeople: Set<string> }) => void
	onCancel: () => void
	onDelete?: () => void
	isLoading?: boolean
	mode: "create" | "edit"
}) {
	let [listName, setListName] = useState(props.defaultListName)
	let [selectedPeople, setSelectedPeople] = useState(
		props.defaultSelectedPeople,
	)

	let hasChanges =
		listName !== props.defaultListName ||
		selectedPeople.size !== props.defaultSelectedPeople.size ||
		[...selectedPeople].some(id => !props.defaultSelectedPeople.has(id))

	let isValid = listName.trim().length > 0 && selectedPeople.size > 0

	let handleSubmit = () => {
		if (!isValid || !hasChanges) return
		props.onSubmit({ listName, selectedPeople })
	}

	return (
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
						disabled={props.isLoading}
						className="flex-1"
					/>
				</div>
				<p className="text-muted-foreground text-xs">
					Lowercase alphanumeric and underscores only
				</p>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Select people</label>
				<PeopleListSelector
					selectedPeople={selectedPeople}
					onSelectionChange={setSelectedPeople}
					searchPlaceholder="Search people..."
					emptyMessage="No people found"
					disabled={props.isLoading}
				/>
			</div>

			<div className="flex justify-between gap-2 pt-2">
				{props.mode === "edit" && props.onDelete && (
					<Button
						variant="destructive"
						size="sm"
						onClick={props.onDelete}
						disabled={props.isLoading}
					>
						Delete list
					</Button>
				)}
				<div className="ml-auto flex gap-2">
					<Button
						variant="outline"
						onClick={props.onCancel}
						disabled={props.isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!hasChanges || !isValid || props.isLoading}
					>
						{props.isLoading ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>
		</div>
	)
}

function PeopleListSelector(props: {
	selectedPeople: Set<string>
	onSelectionChange: (selected: Set<string>) => void
	searchPlaceholder: string
	emptyMessage: string
	disabled?: boolean
}) {
	let people = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(p => !isDeleted(p))
		},
	})

	let [searchQuery, setSearchQuery] = useState("")

	let filteredPeople = useMemo(() => {
		if (!searchQuery) return people
		return people.filter(person =>
			person.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
	}, [people, searchQuery])

	let handleTogglePerson = (personId: string) => {
		let newSet = new Set(props.selectedPeople)
		if (newSet.has(personId)) {
			newSet.delete(personId)
		} else {
			newSet.add(personId)
		}
		props.onSelectionChange(newSet)
	}

	return (
		<div className="space-y-2">
			<Input
				placeholder={props.searchPlaceholder}
				value={searchQuery}
				onChange={e => setSearchQuery(e.target.value)}
				disabled={props.disabled}
				autoFocus
			/>
			<div className="h-64 space-y-1 overflow-y-auto rounded-md">
				{filteredPeople.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center text-sm">
						{props.emptyMessage}
					</div>
				) : (
					filteredPeople.map(person => (
						<button
							key={person.$jazz.id}
							onClick={() => handleTogglePerson(person.$jazz.id)}
							disabled={props.disabled}
							className={`hover:bg-muted active:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors disabled:opacity-50 ${
								props.selectedPeople.has(person.$jazz.id) ? "bg-muted" : ""
							}`}
						>
							<div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
								{props.selectedPeople.has(person.$jazz.id) && (
									<Check className="h-5 w-5" />
								)}
							</div>
							<Avatar className="size-8">
								{person.avatar ? (
									<JazzImage
										imageId={person.avatar.$jazz.id}
										alt={person.name}
										width={32}
										data-slot="avatar-image"
										className="aspect-square size-full object-cover"
									/>
								) : (
									<AvatarFallback className="text-xs">
										{person.name.slice(0, 1)}
									</AvatarFallback>
								)}
							</Avatar>
							<span className="flex-1 text-sm">{person.name}</span>
						</button>
					))
				)}
			</div>
		</div>
	)
}
