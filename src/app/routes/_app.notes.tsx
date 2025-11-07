import { createFileRoute, notFound } from "@tanstack/react-router"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { useNotes } from "#app/features/note-hooks"
import { useAccount } from "jazz-tools/react"
import { type ResolveQuery } from "jazz-tools"
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual"
import { Note, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useDeferredValue, type ReactNode } from "react"
import { TypographyH1, TypographyH2 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { X, Search, FileEarmarkText, Plus } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { NoteListItem } from "#app/features/note-list-item"
import { NewNote } from "#app/features/new-note"

export let Route = createFileRoute("/_app/notes")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()

		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve: query,
		})

		if (!loadedMe) throw notFound()

		return { me: loadedMe }
	},
	component: NotesScreen,
})

let query = {
	root: {
		people: {
			$each: {
				avatar: true,
				notes: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function NotesScreen() {
	let { me: data } = Route.useLoaderData()

	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})

	let currentMe = subscribedMe ?? data

	let { notesSearchQuery } = useAppStore()
	let searchQuery = useDeferredValue(notesSearchQuery)

	let people = (currentMe.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let notes = useNotes(people, searchQuery)

	let didSearch = !!searchQuery
	let hasMatches = notes.active.length > 0 || notes.deleted.length > 0

	let virtualItems: VirtualItem[] = []

	virtualItems.push({ type: "header" })

	if (people.length === 0) {
		virtualItems.push({ type: "no-people" })
	} else if (notes.total === 0) {
		virtualItems.push({ type: "no-notes" })
	} else if (didSearch && !hasMatches) {
		virtualItems.push({ type: "no-results", searchQuery })
	} else if (!didSearch && !hasMatches) {
		virtualItems.push({ type: "all-caught-up" })
	} else {
		notes.active.forEach(({ note, person }) => {
			virtualItems.push({ type: "note", note, person })
		})
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
			// NOTE: always render the headersection
			return [0, ...defaultRangeExtractor(range).filter(i => i !== 0)]
		},
		estimateSize: () => 100,
		overscan: 5,
	})

	let virtualRows = virtualizer.getVirtualItems()

	return (
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

				return (
					<div
						key={virtualRow.key}
						data-index={virtualRow.index}
						ref={virtualizer.measureElement}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						{renderVirtualItem(item, searchQuery)}
					</div>
				)
			})}
		</div>
	)
}

type VirtualItem =
	| { type: "header" }
	| {
			type: "note"
			note: co.loaded<typeof Note>
			person: co.loaded<typeof Person>
	  }
	| { type: "no-results"; searchQuery: string }
	| { type: "all-caught-up" }
	| { type: "no-notes" }
	| { type: "no-people" }
	| { type: "deleted-notes-heading"; count: number }
	| { type: "spacer" }

function renderVirtualItem(item: VirtualItem, searchQuery: string): ReactNode {
	switch (item.type) {
		case "header":
			return <HeaderSection />

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

		case "all-caught-up":
			return <AllCaughtUpState />

		case "no-notes":
			return <NoNotesState />

		case "no-people":
			return <NoPeopleState />

		case "deleted-notes-heading":
			return <DeletedNotesHeading count={item.count} />

		case "spacer":
			return <Spacer />

		default:
			return null
	}
}

function HeaderSection() {
	let autoFocusRef = useAutoFocusInput() as React.RefObject<HTMLInputElement>
	let { notesSearchQuery, setNotesSearchQuery } = useAppStore()
	let t = useIntl()

	return (
		<>
			<title>{t("notes.pageTitle")}</title>
			<TypographyH1>
				<T k="notes.title" />
			</TypographyH1>
			<div className="my-6 flex items-center justify-end gap-3">
				<div className="relative w-full">
					<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
					<Input
						ref={autoFocusRef}
						type="text"
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
		</>
	)
}

function NoPeopleState() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<div className="flex items-center justify-center gap-8 text-center">
				<FileEarmarkText className="text-muted-foreground size-16" />
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">
						<T k="notes.noPeople.title" />
					</h2>
					<p className="text-muted-foreground">
						<T k="notes.noPeople.description" />
					</p>
				</div>
			</div>
		</div>
	)
}

function NoNotesState() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<div className="flex items-center justify-center gap-8 text-center">
				<FileEarmarkText className="text-muted-foreground size-16" />
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">
						<T k="notes.empty.title" />
					</h2>
					<p className="text-muted-foreground">
						<T k="notes.empty.description" />
					</p>
				</div>
			</div>
		</div>
	)
}

function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
				<Search className="text-muted-foreground size-8" />
				<div className="space-y-2">
					<p className="text-muted-foreground text-lg">
						<T k="notes.noResults.message" params={{ query: searchQuery }} />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="notes.noResults.suggestion" />
					</p>
				</div>
			</div>
		</div>
	)
}

function AllCaughtUpState() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
				<FileEarmarkText className="text-muted-foreground size-8" />
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">
						<T k="notes.allCaughtUp.title" />
					</h2>
					<p className="text-muted-foreground">
						<T k="notes.allCaughtUp.description" />
					</p>
				</div>
			</div>
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
