import {
	createFileRoute,
	notFound,
	useElementScrollRestoration,
} from "@tanstack/react-router"
import {
	defaultRangeExtractor,
	useWindowVirtualizer,
} from "@tanstack/react-virtual"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { useAccount } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"
import { usePeople } from "#app/features/person-hooks"
import { useDeferredValue, useId, type ReactNode } from "react"
import { PersonListItem } from "#app/features/person-list-item"
import { useAppStore } from "#app/lib/store"
import { TypographyH1 } from "#shared/ui/typography"
import { Plus, X, Search, PeopleFill } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { NewPerson } from "#app/features/new-person"
import { PersonTour } from "#app/features/person-tour"
import { T, useIntl } from "#shared/intl/setup"
import { calculateEagerLoadCount } from "#shared/lib/viewport-utils"
import { cn } from "#app/lib/utils"
import { UserAccount } from "#shared/schema/user"
import { ListFilterButton } from "#app/features/list-filter-button"

export let Route = createFileRoute("/_app/people/")({
	loader: async ({ context }) => {
		let eagerCount = calculateEagerLoadCount()
		if (!context.me) throw notFound()
		let loadedMe = await context.me.$jazz.ensureLoaded({
			resolve: personListQuery,
		})
		return { me: loadedMe, eagerCount }
	},
	component: PeopleScreen,
})

let personListQuery = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
				$onError: "catch",
			},
		},
		inactivePeople: {
			$each: {
				avatar: true,
				reminders: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>
type LoadedAccount = co.loaded<typeof UserAccount, typeof personListQuery>
type MaybeLoadedPeopleList = LoadedAccount["root"]["people"]
type MaybeLoadedPerson = NonNullable<MaybeLoadedPeopleList>[number]
type LoadedPerson = Extract<MaybeLoadedPerson, { $isLoaded: true }>

function PeopleScreen() {
	let { me: data, eagerCount } = Route.useLoaderData()
	let navigate = Route.useNavigate()

	let subscribedMe = useAccount(UserAccount, {
		resolve: personListQuery,
	})

	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data

	let allPeople = filterVisiblePeople(currentMe.root?.people)
	let inactivePeople = filterVisiblePeople(currentMe.root?.inactivePeople)

	let {
		peopleSearchQuery,
		setPeopleSearchQuery,
		peopleListFilter,
		peopleStatusFilter,
		peopleSortMode,
	} = useAppStore()
	let deferredSearchQuery = useDeferredValue(peopleSearchQuery)

	let people = usePeople<LoadedPerson[], LoadedPerson>(
		allPeople,
		deferredSearchQuery,
		inactivePeople,
		{
			listFilter: peopleListFilter,
			statusFilter: peopleStatusFilter,
			sortMode: peopleSortMode,
		},
	)

	let didSearch = deferredSearchQuery !== "" || peopleListFilter !== null
	let hasPeople = allPeople.length > 0 || (inactivePeople?.length ?? 0) > 0
	let hasResults = people.length > 0

	let virtualItems: Array<VirtualItem> = []
	virtualItems.push({ type: "heading" })

	if (hasPeople) {
		virtualItems.push({ type: "controls" })
	}

	if (!hasPeople) {
		virtualItems.push({ type: "no-people" })
	} else if (didSearch && !hasResults) {
		virtualItems.push({ type: "no-results", searchQuery: deferredSearchQuery })
	} else {
		if (hasResults) {
			people.forEach((person, index) => {
				virtualItems.push({
					type: "person",
					person,
					noLazy: index < eagerCount,
				})
			})
		} else {
			virtualItems.push({ type: "no-active" })
		}

		virtualItems.push({ type: "spacer" })
	}

	let scrollEntry = useElementScrollRestoration({
		getElement: () => window,
	})

	let virtualizer = useWindowVirtualizer({
		count: virtualItems.length,
		rangeExtractor: range => {
			return [0, 1, ...defaultRangeExtractor(range).filter(index => index > 1)]
		},
		estimateSize: () => 112,
		overscan: 5,
		initialOffset: scrollEntry?.scrollY,
		measureElement: (element, _entry, instance) => {
			let direction = instance.scrollDirection
			if (direction === "forward" || direction === null) {
				return element.getBoundingClientRect().height
			}

			let indexKey = Number(element.getAttribute("data-index"))
			let cachedMeasurement = instance.measurementsCache[indexKey]?.size
			return cachedMeasurement || element.getBoundingClientRect().height
		},
	})

	let virtualRows = virtualizer.getVirtualItems()

	return (
		<>
			<div
				className="md:mt-12"
				style={{
					height: virtualizer.getTotalSize(),
					width: "100%",
					position: "relative",
				}}
			>
				{virtualRows.map(virtualRow => {
					let item = virtualItems.at(virtualRow.index)
					if (!item) return null

					let itemIsPerson = item.type === "person"
					let nextItemIsPerson =
						virtualItems.at(virtualRow.index + 1)?.type === "person"

					return (
						<div
							key={virtualRow.key}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							className={cn(
								"absolute top-0 left-0 w-full",
								itemIsPerson && nextItemIsPerson && "border-border border-b",
							)}
							style={{ transform: `translateY(${virtualRow.start}px)` }}
						>
							{renderVirtualItem(item, {
								searchQuery: deferredSearchQuery,
								navigate,
								setPeopleSearchQuery,
								allPeople,
							})}
						</div>
					)
				})}
			</div>
		</>
	)
}

type VirtualItem =
	| { type: "heading" }
	| { type: "controls" }
	| { type: "person"; person: LoadedPerson; noLazy: boolean }
	| { type: "no-results"; searchQuery: string }
	| { type: "no-people" }
	| { type: "no-active" }
	| { type: "spacer" }

function renderVirtualItem(
	item: VirtualItem,
	options: {
		searchQuery: string
		navigate: ReturnType<typeof Route.useNavigate>
		setPeopleSearchQuery: (query: string) => void
		allPeople: LoadedPerson[]
	},
): ReactNode {
	switch (item.type) {
		case "heading":
			return <HeadingSection />

		case "controls":
			return (
				<PeopleControls
					setPeopleSearchQuery={options.setPeopleSearchQuery}
					navigate={options.navigate}
					allPeople={options.allPeople}
				/>
			)

		case "person":
			return (
				<PersonListItem
					person={item.person}
					searchQuery={options.searchQuery}
					noLazy={item.noLazy}
				/>
			)

		case "no-results":
			return <NoSearchResultsState searchQuery={item.searchQuery} />

		case "no-people":
			return (
				<NoPeopleState
					setPeopleSearchQuery={options.setPeopleSearchQuery}
					navigate={options.navigate}
				/>
			)

		case "no-active":
			return (
				<NoActivePeopleState
					navigate={options.navigate}
					setPeopleSearchQuery={options.setPeopleSearchQuery}
				/>
			)

		case "spacer":
			return <Spacer />

		default:
			return null
	}
}

function HeadingSection() {
	let t = useIntl()

	return (
		<>
			<title>{t("people.pageTitle")}</title>
			<TypographyH1>
				<T k="people.title" />
			</TypographyH1>
		</>
	)
}

function PeopleControls({
	setPeopleSearchQuery,
	navigate,
	allPeople,
}: {
	setPeopleSearchQuery: (query: string) => void
	navigate: ReturnType<typeof Route.useNavigate>
	allPeople: LoadedPerson[]
}) {
	let {
		peopleSearchQuery,
		peopleListFilter,
		setPeopleListFilter,
		peopleStatusFilter,
		setPeopleStatusFilter,
		peopleSortMode,
		setPeopleSortMode,
	} = useAppStore()
	let autoFocusRef = useAutoFocusInput()
	let t = useIntl()
	let searchInputId = useId()

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	let sortOptions = [
		{ value: "recent", label: t("filter.sort.recent") },
		{ value: "alphabetical", label: t("filter.sort.alphabetical") },
	]

	return (
		<div className="my-6 flex items-center justify-end gap-3">
			<div className="relative w-full">
				<label htmlFor={searchInputId} className="sr-only">
					{t("people.search.placeholder")}
				</label>
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
				<Input
					ref={input => {
						autoFocusRef.current = input
					}}
					id={searchInputId}
					name="people-search"
					type="search"
					enterKeyHint="search"
					placeholder={t("people.search.placeholder")}
					value={peopleSearchQuery}
					onChange={event => setPeopleSearchQuery(event.target.value)}
					className="w-full pl-10"
				/>
			</div>
			{peopleSearchQuery !== "" ? (
				<Button variant="outline" onClick={() => setPeopleSearchQuery("")}>
					<X className="size-4" />
					<span className="sr-only md:not-sr-only">
						<T k="people.search.clearLabel" />
					</span>
				</Button>
			) : null}
			<ListFilterButton
				people={allPeople}
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
			<NewPerson
				onSuccess={personId => {
					setPeopleSearchQuery("")
					navigate({
						to: "/people/$personID",
						params: { personID: personId },
					})
				}}
			>
				<Button>
					<Plus className="size-4" />
					<span className="sr-only md:not-sr-only">
						<T k="people.newPersonLabel" />
					</span>
				</Button>
			</NewPerson>
		</div>
	)
}

function NoPeopleState({
	navigate,
	setPeopleSearchQuery,
}: {
	navigate: ReturnType<typeof Route.useNavigate>
	setPeopleSearchQuery: (query: string) => void
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-8 text-center">
			<PersonTour
				onSuccess={personId => {
					setPeopleSearchQuery("")
					navigate({
						to: "/people/$personID",
						params: { personID: personId },
					})
				}}
			/>
		</div>
	)
}

function NoActivePeopleState({
	navigate,
	setPeopleSearchQuery,
}: {
	navigate: ReturnType<typeof Route.useNavigate>
	setPeopleSearchQuery: (query: string) => void
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<PeopleFill />
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
						onSuccess={personId => {
							setPeopleSearchQuery("")
							navigate({
								to: "/people/$personID",
								params: { personID: personId },
							})
						}}
					>
						<Button>
							<T k="addPerson.button" />
						</Button>
					</NewPerson>
				</EmptyContent>
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
						<Search />
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

function filterVisiblePeople(
	people: MaybeLoadedPeopleList | undefined,
): LoadedPerson[] {
	if (!people) return []
	return people.filter(isVisiblePerson)
}

function isVisiblePerson(
	person: MaybeLoadedPerson | null,
): person is LoadedPerson {
	// Filter out null, permanently deleted, and inaccessible (unauthorized) people
	return Boolean(person && person.$isLoaded && !person.permanentlyDeletedAt)
}

function Spacer() {
	return <div className="h-20" />
}
