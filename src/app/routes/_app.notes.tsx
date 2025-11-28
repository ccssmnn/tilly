import { createFileRoute, notFound } from "@tanstack/react-router"
import { useNotes, type NotesLoadedAccount } from "#app/features/note-hooks"
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"
import { useDeferredValue, useId, useState, type ReactNode } from "react"
import { TypographyH1, TypographyH2 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { X, Search, Plus } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { NoteListItem } from "#app/features/note-list-item"
import { NewNote } from "#app/features/new-note"
import { NoteTour } from "#app/features/note-tour"
import { cn } from "#app/lib/utils"
import { ListFilterBar } from "#app/features/list-filter-bar"
import { NewListDialog } from "#app/features/new-list-dialog"

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
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function NotesScreen() {
	let { me: data } = Route.useLoaderData()
	let [newListOpen, setNewListOpen] = useState(false)

	let { notesSearchQuery, setNotesSearchQuery } = useAppStore()
	let searchQuery = useDeferredValue(notesSearchQuery)

	let notes = useNotes(searchQuery, data as NotesLoadedAccount)

	let didSearch = !!searchQuery
	let hasMatches = notes.active.length > 0 || notes.deleted.length > 0

	let allPeople = Array.from((data as NotesLoadedAccount).root.people.values())

	let virtualItems: VirtualItem[] = []

	virtualItems.push({ type: "heading" })

	if (notes.total > 0) {
		virtualItems.push({ type: "search" })
		virtualItems.push({ type: "filters" })
	}

	if (notes.total === 0 || (!didSearch && !hasMatches)) {
		virtualItems.push({ type: "no-notes" })
	} else if (didSearch && !hasMatches) {
		virtualItems.push({ type: "no-results", searchQuery })
	} else {
		if (notes.active.length === 0) {
			virtualItems.push({ type: "no-notes" })
		} else {
			notes.active.forEach(({ note, person }) => {
				virtualItems.push({ type: "note", note, person })
			})
		}
		if (notes.deleted.length > 0) {
			virtualItems.push({
				type: "deleted-notes-heading",
				count: notes.deleted.length,
			})
			notes.deleted.forEach(({ note, person }) => {
				virtualItems.push({ type: "note", note, person })
			})
		}
		virtualItems.push({ type: "spacer" })
	}

	// eslint-disable-next-line react-hooks/incompatible-library
	let virtualizer = useVirtualizer({
		count: virtualItems.length,
		getScrollElement: () => document.getElementById("scroll-area"),
		rangeExtractor: range => {
			// NOTE: always render the first two elements (heading and search)
			return [0, 1, ...defaultRangeExtractor(range).filter(i => i > 1)]
		},
		estimateSize: () => 112,
		overscan: 5,
		measureElement: (element, _entry, instance) => {
			const direction = instance.scrollDirection
			if (direction === "forward" || direction === null) {
				// Allow remeasuring when scrolling down or direction is null
				return element.getBoundingClientRect().height
			} else {
				// When scrolling up, use cached measurement to prevent stuttering
				const indexKey = Number(element.getAttribute("data-index"))
				const cachedMeasurement = instance.measurementsCache[indexKey]?.size
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
								"absolute top-0 left-0 w-full overflow-hidden",
								itemIsNote && nextItemIsNote && "border-border border-b",
							)}
							style={{ transform: `translateY(${virtualRow.start}px)` }}
						>
							{renderVirtualItem(
								item,
								searchQuery,
								allPeople,
								() => setNewListOpen(true),
								setNotesSearchQuery,
							)}
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
	| { type: "filters" }
	| { type: "search" }
	| {
			type: "note"
			note: co.loaded<typeof Note>
			person: co.loaded<typeof Person>
	  }
	| { type: "no-results"; searchQuery: string }
	| { type: "no-notes" }
	| { type: "deleted-notes-heading"; count: number }
	| { type: "spacer" }

function renderVirtualItem(
	item: VirtualItem,
	searchQuery: string,
	allPeople: unknown[],
	onNewList: () => void,
	setSearchQuery: (query: string) => void,
): ReactNode {
	switch (item.type) {
		case "heading":
			return <HeadingSection />

		case "filters":
			return (
				<ListFilterBar
					people={allPeople}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					onNewList={onNewList}
				/>
			)

		case "search":
			return <SearchSection />

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

		case "deleted-notes-heading":
			return <DeletedNotesHeading count={item.count} />

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

function SearchSection() {
	let autoFocusRef = useAutoFocusInput() as React.RefObject<HTMLInputElement>
	let { notesSearchQuery, setNotesSearchQuery } = useAppStore()
	let t = useIntl()
	let searchInputId = useId()

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

function DeletedNotesHeading({ count }: { count: number }) {
	return (
		<TypographyH2 className="text-xl first:mt-10">
			<T k="notes.deleted.heading" params={{ count }} />
		</TypographyH2>
	)
}

function Spacer() {
	return <div className="h-20" />
}
