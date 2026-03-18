import { HugeiconsIcon } from "@hugeicons/react"
import {
	Search01Icon,
	UserMultipleIcon,
	Delete02Icon,
} from "@hugeicons/core-free-icons"
import { PeopleFill } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { Button } from "#shared/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { NewPerson } from "../widgets/new-person"

export {
	NoPeopleState,
	NoActivePeopleState,
	NoDeletedPeopleState,
	NoSearchResultsState,
}

function NoPeopleState({
	onSuccess,
}: {
	onSuccess: (personId: string) => void
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-8 text-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<PeopleFill />
					</EmptyMedia>
					<EmptyTitle>
						<T k="addPerson.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="addPerson.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<NewPerson
						onSuccess={onSuccess}
						render={
							<Button>
								<PeopleFill />
								<T k="addPerson.button" />
							</Button>
						}
					/>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function NoActivePeopleState({
	onSuccess,
}: {
	onSuccess: (personId: string) => void
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon icon={UserMultipleIcon} />
					</EmptyMedia>
					<EmptyTitle>
						<T k="addPerson.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="people.noActive.message" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<NewPerson
						onSuccess={onSuccess}
						render={
							<Button>
								<T k="addPerson.button" />
							</Button>
						}
					/>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function NoDeletedPeopleState() {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10">
						<HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="people.empty.noDeleted" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="people.empty.noDeleted.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
	return (
		<div className="container mx-auto mt-6 max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon icon={Search01Icon} />
					</EmptyMedia>
					<EmptyTitle>
						<T
							k="people.search.noResults.message"
							params={{ query: searchQuery }}
						/>
					</EmptyTitle>
					<EmptyDescription>
						<T k="people.search.noResults.suggestion" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
