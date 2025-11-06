import { createFileRoute, notFound } from "@tanstack/react-router"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { useNotes } from "#app/features/note-hooks"
import { useAccount } from "jazz-tools/react"
import { type ResolveQuery } from "jazz-tools"
import { NoteListItem } from "#app/features/note-list-item"

import { TypographyH1 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { X, Search, Journal } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useDeferredValue, type ReactNode } from "react"

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"

export let Route = createFileRoute("/_app/notes")({
	loader: async ({ context }) => {
		if (!context.me) {
			return { me: null }
		}
		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve: query,
		})
		if (!loadedMe) throw notFound()
		return { me: loadedMe }
	},
	component: Notes,
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

function Notes() {
	let { me: data } = Route.useLoaderData()

	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})

	let currentMe = subscribedMe ?? data

	let { notesSearchQuery } = useAppStore()
	let deferredSearchQuery = useDeferredValue(notesSearchQuery)

	let people = (currentMe?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let notes = useNotes(people, deferredSearchQuery)

	if (!currentMe) {
		return (
			<NotesLayout>
				<div className="text-center">
					<p>Please sign in to view notes.</p>
				</div>
			</NotesLayout>
		)
	}

	// Early return for no people - no controls needed
	if (people.length === 0) {
		return (
			<NotesLayout>
				<NoPeopleState />
			</NotesLayout>
		)
	}

	if (notes.total === 0) {
		return (
			<NotesLayout>
				<NoNotesState />
			</NotesLayout>
		)
	}

	let didSearch = !!deferredSearchQuery
	let hasMatches = notes.active.length > 0 || notes.deleted.length > 0
	let hasMore = notes.deleted.length > 0

	if (didSearch && !hasMatches) {
		return (
			<NotesLayout>
				<NotesControls />
				<NoSearchResultsState searchQuery={deferredSearchQuery} />
			</NotesLayout>
		)
	}

	if (!didSearch && !hasMatches) {
		return (
			<NotesLayout>
				<NotesControls />
				<AllCaughtUpState />
			</NotesLayout>
		)
	}

	return (
		<NotesLayout>
			<NotesControls />
			{notes.active.length > 0 ? (
				<ul className="divide-border divide-y">
					{notes.active.map(({ note, person }) => (
						<li key={note.$jazz.id}>
							<NoteListItem
								note={note}
								person={person}
								searchQuery={deferredSearchQuery}
							/>
						</li>
					))}
				</ul>
			) : (
				<AllCaughtUpState />
			)}

			{hasMore && !didSearch && (
				<Accordion type="single" collapsible className="w-full">
					{notes.deleted.length > 0 && (
						<AccordionItem value="deleted">
							<AccordionTrigger>
								<T
									k="notes.deleted.count"
									params={{ count: notes.deleted.length }}
								/>
							</AccordionTrigger>
							<AccordionContent>
								<ul className="divide-border divide-y">
									{notes.deleted.map(({ note, person }) => (
										<li key={note.$jazz.id}>
											<NoteListItem
												note={note}
												person={person}
												searchQuery={deferredSearchQuery}
											/>
										</li>
									))}
								</ul>
							</AccordionContent>
						</AccordionItem>
					)}
				</Accordion>
			)}

			{didSearch && hasMore && (
				<>
					{notes.deleted.length > 0 && (
						<>
							<h3 className="text-muted-foreground mt-8 text-sm font-medium">
								<T
									k="notes.deleted.heading"
									params={{ count: notes.deleted.length }}
								/>
							</h3>
							<ul className="divide-border divide-y">
								{notes.deleted.map(({ note, person }) => (
									<li key={note.$jazz.id}>
										<NoteListItem
											note={note}
											person={person}
											searchQuery={deferredSearchQuery}
										/>
									</li>
								))}
							</ul>
						</>
					)}
				</>
			)}
		</NotesLayout>
	)
}

function NotesLayout({ children }: { children: ReactNode }) {
	let t = useIntl()
	return (
		<div className="space-y-6 md:mt-12">
			<title>{t("notes.pageTitle")}</title>
			<TypographyH1>
				<T k="notes.title" />
			</TypographyH1>
			{children}
		</div>
	)
}

function NotesControls() {
	let { notesSearchQuery, setNotesSearchQuery } = useAppStore()
	let autoFocusRef = useAutoFocusInput()
	let t = useIntl()

	return (
		<div className="flex items-center justify-end gap-3">
			<div className="relative w-full">
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
				<Input
					ref={r => {
						autoFocusRef.current = r
					}}
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
		</div>
	)
}

function NoPeopleState() {
	return (
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
			<Journal className="text-muted-foreground size-16" />
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">
					<T k="notes.noPeople.title" />
				</h2>
				<p className="text-muted-foreground">
					<T k="notes.noPeople.description" />
				</p>
			</div>
		</div>
	)
}

function NoNotesState() {
	return (
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
			<Journal className="text-muted-foreground size-16" />
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">
					<T k="notes.empty.title" />
				</h2>
				<p className="text-muted-foreground">
					<T k="notes.empty.description" />
				</p>
			</div>
		</div>
	)
}

function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
	return (
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
	)
}

function AllCaughtUpState() {
	return (
		<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
			<Journal className="text-muted-foreground size-8" />
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">
					<T k="notes.allCaughtUp.title" />
				</h2>
				<p className="text-muted-foreground">
					<T k="notes.allCaughtUp.description" />
				</p>
			</div>
		</div>
	)
}
