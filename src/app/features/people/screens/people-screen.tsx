import { useDeferredValue } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useIntl } from "#shared/intl/setup"
import { usePeopleData } from "../lib/data"
import { VirtualizedList } from "#app/components/virtualized-list"
import { NewPerson } from "../widgets/new-person"
import { ListFilterButton } from "../parts/list-filter-button"
import { useAvailableLists } from "../lib/list-utilities"
import { usePeopleStore } from "../lib/store"
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
		searchQuery,
		setSearchQuery,
		listFilter,
		setListFilter,
		statusFilter,
		setStatusFilter,
		sortMode,
		setSortMode,
	} = usePeopleStore()
	let deferredSearchQuery = useDeferredValue(searchQuery)

	let { people, allPeople, hasPeople } = usePeopleData(fallback, {
		query: deferredSearchQuery,
		statusFilter: statusFilter,
		listFilter: listFilter,
		sortMode: sortMode,
	})

	let availableLists = useAvailableLists(allPeople)
	let didSearch = deferredSearchQuery !== "" || listFilter !== null
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
		setSearchQuery("")
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
				) : statusFilter === "deleted" && !hasResults ? (
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
								query={searchQuery}
								onChange={setSearchQuery}
								trailing={
									<ListFilterButton
										people={allPeople}
										availableLists={availableLists}
										listFilter={listFilter}
										onListFilterChange={setListFilter}
										statusOptions={statusOptions}
										statusFilter={statusFilter}
										onStatusFilterChange={filter =>
											setStatusFilter(filter as "active" | "deleted")
										}
										sortOptions={sortOptions}
										sortMode={sortMode}
										onSortChange={mode =>
											setSortMode(mode as "recent" | "alphabetical")
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
