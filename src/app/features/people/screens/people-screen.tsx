import { useDeferredValue } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useIntl } from "#shared/intl/setup"
import { usePeopleData } from "../lib/data"
import { VirtualizedList } from "#app/components/virtualized-list"
import { NewPerson } from "../widgets/new-person"
import { ListFilterButton } from "../parts/list-filter-button"
import { useAvailableLists } from "../lib/list-utilities"
import { useAppStore } from "#app/lib/store"
import { calculateEagerLoadCount } from "#shared/lib/viewport-utils"
import { PeoplePageTitle } from "../parts/people-page-title"
import { PeopleToolbar, PeopleSearch } from "../parts/people-toolbar"
import {
	NoPeopleState,
	NoActivePeopleState,
	NoDeletedPeopleState,
	NoSearchResultsState,
} from "../parts/people-fallbacks"
import { ActivePerson } from "../widgets/active-person"
import { DeletedPerson } from "../widgets/deleted-person"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "#shared/ui/button"
import { T } from "#shared/intl/setup"

type PeopleScreenProps = {
	fallback: Parameters<typeof usePeopleData>[0]
}

export function PeopleScreen({ fallback }: PeopleScreenProps) {
	let t = useIntl()
	let navigate = useNavigate()

	let {
		peopleSearchQuery,
		setPeopleSearchQuery,
		peopleListFilter,
		setPeopleListFilter,
		peopleStatusFilter,
		setPeopleStatusFilter,
		peopleSortMode,
		setPeopleSortMode,
	} = useAppStore()
	let deferredSearchQuery = useDeferredValue(peopleSearchQuery)

	let { people, allPeople, hasPeople } = usePeopleData(fallback, {
		query: deferredSearchQuery,
		statusFilter: peopleStatusFilter,
		listFilter: peopleListFilter,
		sortMode: peopleSortMode,
	})

	let availableLists = useAvailableLists(allPeople)
	let didSearch = deferredSearchQuery !== "" || peopleListFilter !== null
	let hasResults = people.length > 0
	let eagerCount = calculateEagerLoadCount()

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	let sortOptions = [
		{ value: "recent", label: t("filter.sort.recent") },
		{ value: "alphabetical", label: t("filter.sort.alphabetical") },
	]

	function handlePersonSuccess(personId: string) {
		setPeopleSearchQuery("")
		navigate({
			to: "/people/$personID",
			params: { personID: personId },
		})
	}

	let items = people.map((person, index) => ({
		person,
		noLazy: index < eagerCount,
	}))

	return (
		<VirtualizedList
			items={items}
			fallback={
				!hasPeople ? (
					<NoPeopleState onSuccess={handlePersonSuccess} />
				) : peopleStatusFilter === "deleted" && !hasResults ? (
					<NoDeletedPeopleState />
				) : didSearch && !hasResults ? (
					<NoSearchResultsState searchQuery={deferredSearchQuery} />
				) : !hasResults ? (
					<NoActivePeopleState onSuccess={handlePersonSuccess} />
				) : null
			}
			staticHeader={
				<>
					<PeoplePageTitle />
					{hasPeople && (
						<PeopleToolbar>
							<PeopleSearch
								query={peopleSearchQuery}
								onChange={setPeopleSearchQuery}
								trailing={
									<ListFilterButton
										people={allPeople}
										availableLists={availableLists}
										listFilter={peopleListFilter}
										onListFilterChange={setPeopleListFilter}
										statusOptions={statusOptions}
										statusFilter={peopleStatusFilter}
										onStatusFilterChange={filter =>
											setPeopleStatusFilter(filter as "active" | "deleted")
										}
										sortOptions={sortOptions}
										sortMode={peopleSortMode}
										onSortChange={mode =>
											setPeopleSortMode(mode as "recent" | "alphabetical")
										}
									/>
								}
							/>
							<NewPerson
								onSuccess={handlePersonSuccess}
								render={
									<Button>
										<HugeiconsIcon icon={Add01Icon} className="size-4" />
										<span className="sr-only md:not-sr-only">
											<T k="people.newPersonLabel" />
										</span>
									</Button>
								}
							/>
						</PeopleToolbar>
					)}
				</>
			}
			renderItem={({ person, noLazy }) =>
				person.deletedAt ? (
					<DeletedPerson
						person={person}
						searchQuery={deferredSearchQuery}
						noLazy={noLazy}
					/>
				) : (
					<ActivePerson
						person={person}
						searchQuery={deferredSearchQuery}
						noLazy={noLazy}
					/>
				)
			}
		/>
	)
}
