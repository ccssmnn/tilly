import {
	createFileRoute,
	notFound,
	useElementScrollRestoration,
} from "@tanstack/react-router"
import { useNotes, type NotesLoadedAccount } from "#app/features/note-hooks"
import {
	defaultRangeExtractor,
	useWindowVirtualizer,
} from "@tanstack/react-virtual"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"
import { useDeferredValue, useId, type ReactNode } from "react"
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
import { X, Search, Plus, Trash } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { NoteListItem } from "#app/features/note-list-item"
import { NewNote } from "#app/features/new-note"
import { NoteTour } from "#app/features/note-tour"
import { cn } from "#app/lib/utils"
import { ListFilterButton } from "#app/features/list-filter-button"
import type { PersonWithSummary } from "#app/features/list-utilities"

export let Route = createFileRoute("/_app/notes")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve,
		})
		if (!loadedMe.$isLoaded) throw notFound()
		return { me: loadedMe }
	},
	component: NotesScreen,
})

let resolve = {
	root: {
		people: {
			$each: {
				notes: { $each: true },
				reminders: { $each: true },
				$onError: "catch",
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function NotesScreen() {
	let { me: data } = Route.useLoaderData()

	let { notesSearchQuery, notesListFilter, notesStatusFilter } = useAppStore()
	let searchQuery = useDeferredValue(notesSearchQuery)

	let { notes, total } = useNotes(searchQuery, data as NotesLoadedAccount, {
		listFilter: notesListFilter,
		statusFilter: notesStatusFilter,
	})

	let didSearch = !!searchQuery || notesListFilter !== null
	let hasResults = notes.length > 0

	let allPeople = data.root.people.filter(p => p?.$isLoaded)

	let virtualItems: VirtualItem[] = []

	virtualItems.push({ type: "heading" })

	if (total > 0) {
		virtualItems.push({ type: "search" })
	}

	if (notesStatusFilter === "deleted" && !hasResults) {
		virtualItems.push({ type: "no-deleted" })
	} else if (total === 0 || (!didSearch && !hasResults)) {
		virtualItems.push({ type: "no-notes" })
	} else if (didSearch && !hasResults) {
		virtualItems.push({ type: "no-results", searchQuery })
	} else {
		if (hasResults) {
			notes.forEach(({ note, person }) => {
				virtualItems.push({ type: "note", note, person })
			})
		} else {
			virtualItems.push({ type: "no-notes" })
		}
		virtualItems.push({ type: "spacer" })
	}

	let scrollEntry = useElementScrollRestoration({
		getElement: () => window,
	})

	let virtualizer = useWindowVirtualizer({
		count: virtualItems.length,
		rangeExtractor: range => {
			// NOTE: always render the first two elements (heading and search)
			return [0, 1, ...defaultRangeExtractor(range).filter(i => i > 1)]
		},
		estimateSize: () => 112,
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

					let itemIsNote = item.type === "note"
					let nextItemIsNote =
						virtualItems.at(virtualRow.index + 1)?.type === "note"

					return (
						<div
							key={virtualRow.key}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							className={cn(
								"absolute top-0 left-0 w-full",
								itemIsNote && nextItemIsNote && "border-border border-b",
							)}
							style={{ transform: `translateY(${virtualRow.start}px)` }}
						>
							{renderVirtualItem(item, searchQuery, allPeople)}
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
			type: "note"
			note: co.loaded<typeof Note>
			person: co.loaded<typeof Person>
	  }
	| { type: "no-results"; searchQuery: string }
	| { type: "no-notes" }
	| { type: "no-deleted" }
	| { type: "spacer" }

function renderVirtualItem(
	item: VirtualItem,
	searchQuery: string,
	allPeople: PersonWithSummary[],
): ReactNode {
	switch (item.type) {
		case "heading":
			return <HeadingSection />

		case "search":
			return <SearchSection allPeople={allPeople} />

		case "note":
			return (
				<NoteListItem
					note={item.note}
					person={item.person}
					searchQuery={searchQuery}
				/>
			)

		case "no-results":
			return <NoSearchResultsState searchQuery={item.searchQuery} />

		case "no-notes":
			return <NoNotesState />

		case "no-deleted":
			return <NoDeletedNotesState />

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
			<title>{t("notes.pageTitle")}</title>
			<TypographyH1>
				<T k="notes.title" />
			</TypographyH1>
		</>
	)
}

function SearchSection({ allPeople }: { allPeople: PersonWithSummary[] }) {
	let autoFocusRef = useAutoFocusInput() as React.RefObject<HTMLInputElement>
	let {
		notesSearchQuery,
		setNotesSearchQuery,
		notesListFilter,
		setNotesListFilter,
		notesStatusFilter,
		setNotesStatusFilter,
	} = useAppStore()
	let t = useIntl()
	let searchInputId = useId()

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	return (
		<div className="my-6 flex items-center justify-end gap-3">
			<div className="relative w-full">
				<label htmlFor={searchInputId} className="sr-only">
					{t("notes.search.placeholder")}
				</label>
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
				<Input
					ref={autoFocusRef}
					id={searchInputId}
					name="notes-search"
					type="search"
					enterKeyHint="search"
					placeholder={t("notes.search.placeholder")}
					value={notesSearchQuery}
					onChange={e => setNotesSearchQuery(e.target.value)}
					className="w-full pl-10"
				/>
			</div>
			{notesSearchQuery !== "" ? (
				<Button variant="outline" onClick={() => setNotesSearchQuery("")}>
					<X className="size-4" />
					<span className="sr-only md:not-sr-only">
						<T k="common.clear" />
					</span>
				</Button>
			) : null}
			<ListFilterButton
				people={allPeople}
				listFilter={notesListFilter}
				onListFilterChange={setNotesListFilter}
				statusOptions={statusOptions}
				statusFilter={notesStatusFilter}
				onStatusFilterChange={filter =>
					setNotesStatusFilter(filter as "active" | "deleted")
				}
			/>
			<NewNote>
				<Button>
					<Plus className="size-4" />
					<span className="sr-only md:not-sr-only">
						<T k="notes.addButton" />
					</span>
				</Button>
			</NewNote>
		</div>
	)
}

function NoNotesState() {
	return (
		<div className="flex flex-col items-center justify-center gap-8 text-center">
			<NoteTour />
		</div>
	)
}

function NoDeletedNotesState() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10">
						<Trash className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="notes.empty.noDeleted" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="notes.empty.noDeleted.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
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
						<T k="notes.noResults.message" params={{ query: searchQuery }} />
					</EmptyTitle>
					<EmptyDescription>
						<T k="notes.noResults.suggestion" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function Spacer() {
	return <div className="h-20" />
}
