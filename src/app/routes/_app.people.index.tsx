import { createFileRoute, notFound } from "@tanstack/react-router"
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual"
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
import { co } from "jazz-tools"
import { usePeople } from "#app/features/person-hooks"
import { useDeferredValue, useId, type ReactNode } from "react"
import { PersonListItem } from "#app/features/person-list-item"
import { useAppStore } from "#app/lib/store"
import { TypographyH1, TypographyH2 } from "#shared/ui/typography"
import { Plus, X, Search, PeopleFill } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { NewPerson } from "#app/features/new-person"
import { PersonTour } from "#app/features/person-tour"
import { T, useIntl } from "#shared/intl/setup"
import { calculateEagerLoadCount } from "#shared/lib/viewport-utils"
import { cn } from "#app/lib/utils"
import { UserAccount } from "#shared/schema/user"
import { personListQuery } from "#app/features/person-query"
import type { LoadedPerson as PersonListLoadedPerson } from "#app/features/person-query"
import { ListFilterButton } from "#app/features/list-filter-button"
import { NewListDialog } from "#app/features/new-list-dialog"
import { useState } from "react"

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

type LoadedAccount = co.loaded<typeof UserAccount, typeof personListQuery>
type LoadedPeopleList = LoadedAccount["root"]["people"]
type LoadedPerson = PersonListLoadedPerson

function PeopleScreen() {
	let { me: data, eagerCount } = Route.useLoaderData()
	let navigate = Route.useNavigate()
	let [newListOpen, setNewListOpen] = useState(false)

	let subscribedMe = useAccount(UserAccount, {
		resolve: personListQuery,
	})

	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data
	let allPeople = filterVisiblePeople(currentMe.root?.people)

	let { peopleSearchQuery, setPeopleSearchQuery } = useAppStore()
	let deferredSearchQuery = useDeferredValue(peopleSearchQuery)

	let people = usePeople<LoadedPerson[], LoadedPerson>(
		allPeople,
		deferredSearchQuery,
	)

	let didSearch = deferredSearchQuery !== ""
	let hasMatches = people.active.length > 0 || people.deleted.length > 0
	let hasPeople = allPeople.length > 0
	let hasDeleted = people.deleted.length > 0
	let hasActive = people.active.length > 0

	let virtualItems: Array<VirtualItem> = []
	virtualItems.push({ type: "heading" })

	if (hasPeople) {
		virtualItems.push({ type: "controls" })
	}

	if (!hasPeople) {
		virtualItems.push({ type: "no-people" })
	} else if (didSearch && !hasMatches) {
		virtualItems.push({ type: "no-results", searchQuery: deferredSearchQuery })
	} else {
		if (hasActive) {
			people.active.forEach((person, index) => {
				virtualItems.push({
					type: "person",
					person,
					noLazy: index < eagerCount,
				})
			})
		} else {
			virtualItems.push({ type: "no-active" })
		}

		if (hasDeleted) {
			virtualItems.push({
				type: "deleted-heading",
				count: people.deleted.length,
			})
			people.deleted.forEach((person, index) => {
				virtualItems.push({
					type: "person",
					person,
					noLazy: index < eagerCount,
				})
			})
		}

		virtualItems.push({ type: "spacer" })
	}

	// eslint-disable-next-line react-hooks/incompatible-library
	let virtualizer = useVirtualizer({
		count: virtualItems.length,
		getScrollElement: () => document.getElementById("scroll-area"),
		rangeExtractor: range => {
			return [0, 1, ...defaultRangeExtractor(range).filter(index => index > 1)]
		},
		estimateSize: () => 112,
		overscan: 5,
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
								onNewList: () => setNewListOpen(true),
							})}
						</div>
					)
				})}
			</div>
			<NewListDialog
				open={newListOpen}
				onOpenChange={setNewListOpen}
				people={allPeople}
			/>
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
	| { type: "deleted-heading"; count: number }
	| { type: "spacer" }

function renderVirtualItem(
	item: VirtualItem,
	options: {
		searchQuery: string
		navigate: ReturnType<typeof Route.useNavigate>
		setPeopleSearchQuery: (query: string) => void
		allPeople: LoadedPerson[]
		onNewList: () => void
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
					searchQuery={options.searchQuery}
					onNewList={options.onNewList}
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

		case "deleted-heading":
			return <DeletedHeading count={item.count} />

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
	searchQuery,
	onNewList,
}: {
	setPeopleSearchQuery: (query: string) => void
	navigate: ReturnType<typeof Route.useNavigate>
	allPeople: LoadedPerson[]
	searchQuery: string
	onNewList: () => void
}) {
	let { peopleSearchQuery } = useAppStore()
	let autoFocusRef = useAutoFocusInput()
	let t = useIntl()
	let searchInputId = useId()

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
				searchQuery={searchQuery}
				setSearchQuery={setPeopleSearchQuery}
				onNewList={onNewList}
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
		<div className="mt-6 flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
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

function DeletedHeading({ count }: { count: number }) {
	return (
		<TypographyH2 className="text-xl first:mt-10">
			<T k="people.deleted.heading" params={{ count }} />
		</TypographyH2>
	)
}

function filterVisiblePeople(
	people: LoadedPeopleList | undefined,
): LoadedPerson[] {
	if (!people) return []
	return people.filter(isVisiblePerson)
}

function isVisiblePerson(
	person: LoadedPeopleList[number],
): person is LoadedPerson {
	return Boolean(person && !person.permanentlyDeletedAt)
}

function Spacer() {
	return <div className="h-20" />
}
