import { createFileRoute, notFound } from "@tanstack/react-router"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { useReminders } from "#app/features/reminder-hooks"
import { useAccount } from "jazz-tools/react"
import { type ResolveQuery } from "jazz-tools"
import { ReminderListItem } from "#app/features/reminder-list-item"

import { TypographyH1 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Plus, X, Search, Bell } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useDeferredValue, type ReactNode } from "react"

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"
import { NewReminder } from "#app/features/new-reminder"
import { ReminderTour } from "#app/features/reminder-tour"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { calculateEagerLoadCount } from "#shared/lib/viewport-utils"

export let Route = createFileRoute("/_app/reminders")({
	loader: async ({ context }) => {
		let eagerCount = calculateEagerLoadCount()
		if (!context.me) {
			return { me: null, eagerCount }
		}
		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve: query,
		})
		if (!loadedMe) throw notFound()
		return { me: loadedMe, eagerCount }
	},
	component: Reminders,
})

let query = {
	root: {
		people: {
			$each: {
				avatar: true,
				reminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function Reminders() {
	let { me: data, eagerCount } = Route.useLoaderData()

	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})

	let currentMe = subscribedMe ?? data

	let { remindersSearchQuery } = useAppStore()
	let deferredSearchQuery = useDeferredValue(remindersSearchQuery)

	let people = (currentMe?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let reminders = useReminders(people, deferredSearchQuery)

	if (!currentMe) {
		return (
			<RemindersLayout>
				<div className="text-center">
					<p>Please sign in to view reminders.</p>
				</div>
			</RemindersLayout>
		)
	}

	if (reminders.total === 0) {
		return (
			<RemindersLayout>
				<NoRemindersState />
			</RemindersLayout>
		)
	}

	let didSearch = !!deferredSearchQuery
	let hasMatches =
		reminders.open.length > 0 ||
		reminders.done.length > 0 ||
		reminders.deleted.length > 0
	let hasMore = reminders.done.length > 0 || reminders.deleted.length > 0

	if (didSearch && !hasMatches) {
		return (
			<RemindersLayout>
				<RemindersControls />
				<NoSearchResultsState searchQuery={deferredSearchQuery} />
			</RemindersLayout>
		)
	}

	if (!didSearch && !hasMatches) {
		return (
			<RemindersLayout>
				<RemindersControls />
				<AllCaughtUpState />
			</RemindersLayout>
		)
	}

	return (
		<RemindersLayout>
			<RemindersControls />
			{reminders.open.length > 0 ? (
				<ul className="divide-border divide-y">
					{reminders.open.map(({ reminder, person }, index) => (
						<li key={reminder.$jazz.id}>
							<ReminderListItem
								reminder={reminder}
								person={person}
								userId={currentMe.$jazz.id}
								searchQuery={deferredSearchQuery}
								noLazy={index < eagerCount}
							/>
						</li>
					))}
				</ul>
			) : (
				<AllCaughtUpState />
			)}

			{hasMore && !didSearch && (
				<Accordion type="single" collapsible className="w-full">
					{reminders.done.length > 0 && (
						<AccordionItem value="done">
							<AccordionTrigger>
								<T
									k="reminders.done.count"
									params={{ count: reminders.done.length }}
								/>
							</AccordionTrigger>
							<AccordionContent>
								<ul className="divide-border divide-y">
									{reminders.done.map(({ reminder, person }, index) => (
										<li key={reminder.$jazz.id}>
											<ReminderListItem
												reminder={reminder}
												person={person}
												userId={currentMe.$jazz.id}
												searchQuery={deferredSearchQuery}
												noLazy={index < eagerCount}
											/>
										</li>
									))}
								</ul>
							</AccordionContent>
						</AccordionItem>
					)}
					{reminders.deleted.length > 0 && (
						<AccordionItem value="deleted">
							<AccordionTrigger>
								<T
									k="reminders.deleted.count"
									params={{ count: reminders.deleted.length }}
								/>
							</AccordionTrigger>
							<AccordionContent>
								<ul className="divide-border divide-y">
									{reminders.deleted.map(({ reminder, person }, index) => (
										<li key={reminder.$jazz.id}>
											<ReminderListItem
												reminder={reminder}
												person={person}
												userId={currentMe.$jazz.id}
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
					{reminders.done.length > 0 && (
						<>
							<h3 className="text-muted-foreground mt-8 text-sm font-medium">
								<T
									k="reminders.done.heading"
									params={{ count: reminders.done.length }}
								/>
							</h3>
							<ul className="divide-border divide-y">
								{reminders.done.map(({ reminder, person }, index) => (
									<li key={reminder.$jazz.id}>
										<ReminderListItem
											reminder={reminder}
											person={person}
											userId={currentMe.$jazz.id}
											searchQuery={deferredSearchQuery}
											noLazy={index < eagerCount}
										/>
									</li>
								))}
							</ul>
						</>
					)}
					{reminders.deleted.length > 0 && (
						<>
							<h3 className="text-muted-foreground mt-8 text-sm font-medium">
								<T
									k="reminders.deleted.heading"
									params={{ count: reminders.deleted.length }}
								/>
							</h3>
							<ul className="divide-border divide-y">
								{reminders.deleted.map(({ reminder, person }, index) => (
									<li key={reminder.$jazz.id}>
										<ReminderListItem
											reminder={reminder}
											person={person}
											userId={currentMe.$jazz.id}
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
		</RemindersLayout>
	)
}

function RemindersLayout({ children }: { children: ReactNode }) {
	let t = useIntl()
	return (
		<div className="space-y-6 md:mt-12">
			<title>{t("reminders.pageTitle")}</title>
			<TypographyH1>
				<T k="reminders.title" />
			</TypographyH1>
			{children}
		</div>
	)
}

function RemindersControls() {
	let { remindersSearchQuery, setRemindersSearchQuery } = useAppStore()
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
					placeholder={t("reminders.search.placeholder")}
					value={remindersSearchQuery}
					onChange={e => setRemindersSearchQuery(e.target.value)}
					className="w-full pl-10"
				/>
			</div>
			{remindersSearchQuery !== "" ? (
				<Button variant="outline" onClick={() => setRemindersSearchQuery("")}>
					<X className="size-4" />
					<span className="sr-only md:not-sr-only">
						<T k="common.clear" />
					</span>
				</Button>
			) : null}
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
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
			<ReminderTour />
		</div>
	)
}

function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
	return (
		<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
			<Search className="text-muted-foreground size-8" />
			<div className="space-y-2">
				<p className="text-muted-foreground text-lg">
					<T k="reminders.noResults.message" params={{ query: searchQuery }} />
				</p>
				<p className="text-muted-foreground text-sm">
					<T k="reminders.noResults.suggestion" />
				</p>
			</div>
		</div>
	)
}

function AllCaughtUpState() {
	return (
		<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
			<Bell className="text-muted-foreground size-8" />
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">
					<T k="reminders.allCaughtUp.title" />
				</h2>
				<p className="text-muted-foreground">
					<T k="reminders.allCaughtUp.description" />
				</p>
			</div>
		</div>
	)
}
