import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import { useMemo, useState } from "react"
import { Check } from "react-bootstrap-icons"
import { Input } from "#shared/ui/input"

export { PeopleListSelector }

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
			/>
			<div className="h-64 space-y-1 overflow-y-auto rounded-md">
				{filteredPeople.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center text-sm">
						{props.emptyMessage}
					</div>
				) : (
					filteredPeople.map(person => (
						<button
							type="button"
							key={person.$jazz.id}
							onClick={() => handleTogglePerson(person.$jazz.id)}
							disabled={props.disabled}
							className={`pointer-fine:hover:bg-muted active:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors disabled:opacity-50 ${
								props.selectedPeople.has(person.$jazz.id) ? "bg-muted" : ""
							}`}
						>
							<div className="flex h-5 w-5 shrink-0 items-center justify-center">
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
