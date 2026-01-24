import {
	createFileRoute,
	notFound,
	useElementScrollRestoration,
} from "@tanstack/react-router"
import { UserAccount } from "#shared/schema/user"
import {
	useReminders,
	type RemindersLoadedAccount,
} from "#app/features/reminder-hooks"
import { useAccount } from "jazz-tools/react"
import { type ResolveQuery } from "jazz-tools"
import { ReminderListItem } from "#app/features/reminder-list-item"
import { TypographyH1 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { Plus, X, Search, Bell, Trash, Check } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useDeferredValue, useId, type ReactNode, type RefObject } from "react"
import { NewReminder } from "#app/features/new-reminder"
import { ReminderTour } from "#app/features/reminder-tour"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import {
	defaultRangeExtractor,
	useWindowVirtualizer,
} from "@tanstack/react-virtual"
import { cn } from "#app/lib/utils"
import { ListFilterButton } from "#app/features/list-filter-button"
import type { PersonWithSummary } from "#app/features/list-utilities"

export let Route = createFileRoute("/_app/reminders")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve,
		})
		if (!loadedMe.$isLoaded) throw notFound()
		return { me: loadedMe }
	},
	component: Reminders,
})

let resolve = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function Reminders() {
	let { me: data } = Route.useLoaderData()

	let subscribedMe = useAccount(UserAccount, { resolve })

	let currentMe = subscribedMe.$isLoaded ? subscribedMe : data

	let {
		remindersSearchQuery,
		setRemindersSearchQuery,
		remindersListFilter,
		remindersStatusFilter,
	} = useAppStore()
	let searchQuery = useDeferredValue(remindersSearchQuery)

	let { reminders, total } = useReminders(
		searchQuery,
		data as RemindersLoadedAccount,
		{
			listFilter: remindersListFilter,
			statusFilter: remindersStatusFilter,
		},
	)

	let allPeople = Array.from(
		(data as RemindersLoadedAccount).root.people.values(),
	).filter(
		(p): p is Extract<typeof p, { $isLoaded: true }> => p?.$isLoaded === true,
	)

	let didSearch = !!searchQuery || remindersListFilter !== null
	let hasResults = reminders.length > 0

	let virtualItems: Array<VirtualItem> = []
	virtualItems.push({ type: "heading" })

	if (total > 0) {
		virtualItems.push({ type: "search" })
	} else {
		virtualItems.push({ type: "no-reminders" })
	}

	if (total > 0) {
		if (remindersStatusFilter === "deleted" && !hasResults) {
			virtualItems.push({ type: "no-deleted" })
		} else if (remindersStatusFilter === "done" && !hasResults) {
			virtualItems.push({ type: "no-done" })
		} else if (didSearch && !hasResults) {
			virtualItems.push({ type: "no-results", searchQuery })
		} else {
			if (hasResults) {
				reminders.forEach(({ reminder, person }) => {
					virtualItems.push({
						type: "reminder",
						reminder,
						person,
					})
				})
			} else if (remindersStatusFilter === "active") {
				virtualItems.push({ type: "all-caught-up" })
			}

			virtualItems.push({ type: "spacer" })
		}
	}

	let scrollEntry = useElementScrollRestoration({
		getElement: () => window,
	})

	let virtualizer = useWindowVirtualizer({
		count: virtualItems.length,
		rangeExtractor: range => {
			return [0, 1, ...defaultRangeExtractor(range).filter(i => i > 1)]
		},
		estimateSize: () => 100,
		overscan: 5,
		initialOffset: scrollEntry?.scrollY,
		measureElement: (element, _entry, instance) => {
			let direction = instance.scrollDirection
			if (direction === "forward" || direction === null) {
				return element.getBoundingClientRect().height
			} else {
				let indexKey = Number(element.getAttribute("data-index"))
				let cachedMeasurement = instance.measurementsCache[indexKey]?.size
				return cachedMeasurement || element.getBoundingClientRect().height
			}
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

					let itemIsReminder = item.type === "reminder"
					let nextItemIsReminder =
						virtualItems.at(virtualRow.index + 1)?.type === "reminder"

					return (
						<div
							key={virtualRow.key}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							className={cn(
								"absolute top-0 left-0 w-full",
								itemIsReminder &&
									nextItemIsReminder &&
									"border-border border-b",
							)}
							style={{ transform: `translateY(${virtualRow.start}px)` }}
						>
							{renderVirtualItem(item, {
								searchQuery,
								me: currentMe,
								allPeople,
								setSearchQuery: setRemindersSearchQuery,
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
	| { type: "search" }
	| {
			type: "reminder"
			reminder: co.loaded<typeof Reminder>
			person: co.loaded<typeof Person>
	  }
	| { type: "no-results"; searchQuery: string }
	| { type: "no-reminders" }
	| { type: "all-caught-up" }
	| { type: "no-done" }
	| { type: "no-deleted" }
	| { type: "spacer" }

function renderVirtualItem(
	item: VirtualItem,
	options: {
		searchQuery: string
		me: co.loaded<typeof UserAccount>
		allPeople: PersonWithSummary[]
		setSearchQuery: (query: string) => void
	},
): ReactNode {
	switch (item.type) {
		case "heading":
			return <HeadingSection />

		case "search":
			return <SearchSection allPeople={options.allPeople} />

		case "reminder":
			return (
				<ReminderListItem
					reminder={item.reminder}
					person={item.person}
					me={options.me}
					searchQuery={options.searchQuery}
				/>
			)

		case "no-results":
			return <NoSearchResultsState searchQuery={item.searchQuery} />

		case "no-reminders":
			return <NoRemindersState />

		case "all-caught-up":
			return <AllCaughtUpState />

		case "no-done":
			return <NoDoneRemindersState />

		case "no-deleted":
			return <NoDeletedRemindersState />

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
			<title>{t("reminders.pageTitle")}</title>
			<TypographyH1>
				<T k="reminders.title" />
			</TypographyH1>
		</>
	)
}

function SearchSection({ allPeople }: { allPeople: PersonWithSummary[] }) {
	let {
		remindersSearchQuery,
		setRemindersSearchQuery,
		remindersListFilter,
		setRemindersListFilter,
		remindersStatusFilter,
		setRemindersStatusFilter,
	} = useAppStore()
	let autoFocusRef = useAutoFocusInput() as RefObject<HTMLInputElement>
	let t = useIntl()
	let searchInputId = useId()

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "done", label: t("filter.status.done") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	return (
		<div className="mt-6 mb-3 flex items-center justify-end gap-3">
			<div className="relative w-full">
				<label htmlFor={searchInputId} className="sr-only">
					{t("reminders.search.placeholder")}
				</label>
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
				<Input
					ref={autoFocusRef}
					id={searchInputId}
					name="reminders-search"
					type="search"
					enterKeyHint="search"
					placeholder={t("reminders.search.placeholder")}
					value={remindersSearchQuery}
					onChange={e => setRemindersSearchQuery(e.target.value)}
					className="w-full pl-10"
				/>
			</div>
			{remindersSearchQuery !== "" ? (
				<Button variant="outline" onClick={() => setRemindersSearchQuery("")}>
					<X />
					<span className="sr-only md:not-sr-only">
						<T k="common.clear" />
					</span>
				</Button>
			) : null}
			<ListFilterButton
				people={allPeople}
				listFilter={remindersListFilter}
				onListFilterChange={setRemindersListFilter}
				statusOptions={statusOptions}
				statusFilter={remindersStatusFilter}
				onStatusFilterChange={filter =>
					setRemindersStatusFilter(filter as "active" | "done" | "deleted")
				}
			/>
			<NewReminder>
				<Button>
					<Plus className="size-4" />
					<span className="sr-only md:not-sr-only">
						<T k="reminders.addButton" />
					</span>
				</Button>
			</NewReminder>
		</div>
	)
}

function NoRemindersState() {
	return (
		<div className="flex flex-col items-center justify-center gap-8 text-center">
			<ReminderTour />
		</div>
	)
}

function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Search />
					</EmptyMedia>
					<EmptyTitle>
						<T
							k="reminders.noResults.message"
							params={{ query: searchQuery }}
						/>
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.noResults.suggestion" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function AllCaughtUpState() {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Bell />
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.allCaughtUp.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.allCaughtUp.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function NoDoneRemindersState() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Check className="text-muted-foreground" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.empty.noDone" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.empty.noDone.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function NoDeletedRemindersState() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10">
						<Trash className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.empty.noDeleted" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.empty.noDeleted.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function Spacer() {
	return <div className="h-20" />
}
