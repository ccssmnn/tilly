import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import { Input } from "#shared/ui/input"
import { useState, useMemo } from "react"

export { PersonSelector }

function PersonSelector(props: {
	onPersonSelected: (personId: string) => void
	searchPlaceholder: string
	emptyMessage: string
	selectedPersonId?: string
}) {
	let { me } = useAccount(UserAccount, {
		resolve: {
			root: {
				people: {
					$each: true,
				},
			},
		},
	})
	let [searchQuery, setSearchQuery] = useState("")

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let filteredPeople = useMemo(() => {
		if (!searchQuery) return people
		return people.filter(person =>
			person.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
	}, [people, searchQuery])

	return (
		<div className="space-y-4">
			<Input
				placeholder={props.searchPlaceholder}
				value={searchQuery}
				onChange={e => setSearchQuery(e.target.value)}
				autoFocus
			/>
			<div className="h-[300px] space-y-1 overflow-y-auto">
				{filteredPeople.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						{props.emptyMessage}
					</div>
				) : (
					filteredPeople.map(person => (
						<button
							key={person.$jazz.id}
							onClick={() => props.onPersonSelected(person.$jazz.id)}
							className={`hover:bg-muted active:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
								props.selectedPersonId === person.$jazz.id
									? "bg-muted border-border border"
									: ""
							}`}
						>
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
							<span className="flex-1">{person.name}</span>
						</button>
					))
				)}
			</div>
		</div>
	)
}
