import { createFileRoute } from "@tanstack/react-router"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { usePeople } from "#app/features/person-hooks"
import { type ResolveQuery } from "jazz-tools"
import { useDeferredValue, type ReactNode } from "react"
import { PersonListItem } from "#app/features/person-list-item"
import { useAppStore } from "#app/lib/store"
import { TypographyH1 } from "#shared/ui/typography"
import { Plus, X, Search, People } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { NewPerson } from "#app/features/new-person"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"
import { SignInPrompt } from "#app/features/auth-prompt"
import { T, useIntl } from "#shared/intl/setup"
import { calculateEagerLoadCount } from "#shared/lib/viewport-utils"

export let Route = createFileRoute("/_app/people/")({
	loader: async ({ context }) => {
		let eagerCount = calculateEagerLoadCount()
		if (!context.me) {
			return { me: null, eagerCount }
		}
		let loadedMe = await context.me.$jazz.ensureLoaded({
			resolve: query,
		})
		return { me: loadedMe, eagerCount }
	},
	component: PeopleScreen,
})

let query = {
	root: { people: { $each: { avatar: true, reminders: { $each: true } } } },
} as const satisfies ResolveQuery<typeof UserAccount>

function PeopleScreen() {
	let { me: data, eagerCount } = Route.useLoaderData()
	let navigate = Route.useNavigate()

	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})

	let currentMe = subscribedMe ?? data
	let allPeople = currentMe?.root.people ?? []

	let { peopleSearchQuery, setPeopleSearchQuery } = useAppStore()
	let deferredSearchQuery = useDeferredValue(peopleSearchQuery)

	let people = usePeople(allPeople, deferredSearchQuery)

	let didSearch = !!deferredSearchQuery
	let hasMatches = people.active.length > 0 || people.deleted.length > 0
	let hasMore = people.deleted.length > 0

	if (allPeople.length === 0) {
		return (
			<PeopleLayout>
				<NoPeopleState
					navigate={navigate}
					setPeopleSearchQuery={setPeopleSearchQuery}
				/>
			</PeopleLayout>
		)
	}

	if (didSearch && !hasMatches) {
		return (
			<PeopleLayout>
				<PeopleControls
					setPeopleSearchQuery={setPeopleSearchQuery}
					navigate={navigate}
				/>
				<NoSearchResultsState searchQuery={deferredSearchQuery} />
			</PeopleLayout>
		)
	}

	return (
		<PeopleLayout>
			<PeopleControls
				setPeopleSearchQuery={setPeopleSearchQuery}
				navigate={navigate}
			/>

			{people.active.length > 0 ? (
				<ul className="divide-border divide-y">
					{people.active.map((person, index) => (
						<li key={person.$jazz.id}>
							<PersonListItem
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								person={person as any} // TODO: ouch :(
								searchQuery={deferredSearchQuery}
								noLazy={index < eagerCount}
							/>
						</li>
					))}
				</ul>
			) : (
				<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
					<p className="text-muted-foreground text-lg">
						<T k="people.noActive.message" />
					</p>
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
							<T k="people.noActive.addButton" />
						</Button>
					</NewPerson>
				</div>
			)}

			{hasMore && !didSearch && (
				<Accordion type="single" collapsible className="w-full">
					{people.deleted.length > 0 && (
						<AccordionItem value="deleted">
							<AccordionTrigger>
								<T
									k="people.deleted.count"
									params={{ count: people.deleted.length }}
								/>
							</AccordionTrigger>
							<AccordionContent>
								<ul className="divide-border divide-y">
									{people.deleted.map((person, index) => (
										<li key={person.$jazz.id}>
											<PersonListItem
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												person={person as any} // TODO: ouch :(
												searchQuery={deferredSearchQuery}
												noLazy={index < eagerCount}
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
					{people.deleted.length > 0 && (
						<>
							<h3 className="text-muted-foreground mt-8 text-sm font-medium">
								<T
									k="people.deleted.heading"
									params={{ count: people.deleted.length }}
								/>
							</h3>
							<ul className="divide-border divide-y">
								{people.deleted.map((person, index) => (
									<li key={person.$jazz.id}>
										<PersonListItem
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											person={person as any} // TODO: ouch :(
											searchQuery={deferredSearchQuery}
											noLazy={index < eagerCount}
										/>
									</li>
								))}
							</ul>
						</>
					)}
				</>
			)}
		</PeopleLayout>
	)
}

function PeopleLayout({ children }: { children: ReactNode }) {
	let t = useIntl()
	return (
		<div className="space-y-6 md:mt-12">
			<title>{t("people.pageTitle")}</title>
			<TypographyH1>
				<T k="people.title" />
			</TypographyH1>
			{children}
		</div>
	)
}

function PeopleControls({
	setPeopleSearchQuery,
	navigate,
}: {
	setPeopleSearchQuery: (query: string) => void
	navigate: ReturnType<typeof Route.useNavigate>
}) {
	let { peopleSearchQuery } = useAppStore()
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
					placeholder={t("people.search.placeholder")}
					value={peopleSearchQuery}
					onChange={e => setPeopleSearchQuery(e.target.value)}
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
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-around gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
			<div className="space-y-4">
				<People className="text-muted-foreground mx-auto size-12" />
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">
						<T k="people.empty.heading" />
					</h2>
					<p className="text-muted-foreground">
						<T k="people.empty.description" />
					</p>
				</div>
				<NewPerson
					onSuccess={personId => {
						setPeopleSearchQuery("")
						navigate({
							to: "/people/$personID",
							params: { personID: personId },
						})
					}}
				>
					<Button className="mt-2">
						<T k="people.empty.addButton" />
					</Button>
				</NewPerson>
			</div>
			<SignInPrompt />
		</div>
	)
}

function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
	return (
		<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
			<Search className="text-muted-foreground size-8" />
			<div className="space-y-2">
				<p className="text-muted-foreground text-lg">
					<T
						k="people.search.noResults.message"
						params={{ query: searchQuery }}
					/>
				</p>
				<p className="text-muted-foreground text-sm">
					<T k="people.search.noResults.suggestion" />
				</p>
			</div>
		</div>
	)
}
