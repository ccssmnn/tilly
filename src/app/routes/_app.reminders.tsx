import { createFileRoute, notFound } from "@tanstack/react-router"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { useReminders } from "#app/features/reminder-hooks"
import { useAccount } from "jazz-tools/react"
import { type ResolveQuery } from "jazz-tools"
import { ReminderListItem } from "#app/features/reminder-list-item"
import { TypographyH1, TypographyH2 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Plus, X, Search, Bell } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useDeferredValue, type ReactNode, type RefObject } from "react"
import { NewReminder } from "#app/features/new-reminder"
import { ReminderTour } from "#app/features/reminder-tour"
import { useAppStore } from "#app/lib/store"
import { T, useIntl } from "#shared/intl/setup"
import { Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "#app/lib/utils"

export let Route = createFileRoute("/_app/reminders")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let loadedMe = await UserAccount.load(context.me.$jazz.id, {
			resolve: query,
		})
		if (!loadedMe) throw notFound()
		return { me: loadedMe }
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
	let { me: data } = Route.useLoaderData()

	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})

	let currentMe = subscribedMe ?? data

	let { remindersSearchQuery } = useAppStore()
	let searchQuery = useDeferredValue(remindersSearchQuery)

	let people = (currentMe.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let reminders = useReminders(people, searchQuery)

	let didSearch = !!searchQuery
	let hasMatches =
		reminders.open.length > 0 ||
		reminders.done.length > 0 ||
		reminders.deleted.length > 0

	let virtualItems: Array<VirtualItem> = []
	virtualItems.push({ type: "heading" })

	if (reminders.total > 0) {
		virtualItems.push({ type: "search" })
	} else {
		virtualItems.push({ type: "no-reminders" })
	}

	if (reminders.total > 0) {
		if (didSearch && !hasMatches) {
			virtualItems.push({ type: "no-results", searchQuery })
		} else {
			if (reminders.open.length > 0) {
				reminders.open.forEach(({ reminder, person }) => {
					virtualItems.push({
						type: "reminder",
						reminder,
						person,
					})
				})
			} else if (!didSearch) {
				virtualItems.push({ type: "all-caught-up" })
			}

			if (reminders.done.length > 0) {
				virtualItems.push({
					type: "section-heading",
					section: "done",
					count: reminders.done.length,
				})
				reminders.done.forEach(({ reminder, person }) => {
					virtualItems.push({
						type: "reminder",
						reminder,
						person,
					})
				})
			}

			if (reminders.deleted.length > 0) {
				virtualItems.push({
					type: "section-heading",
					section: "deleted",
					count: reminders.deleted.length,
				})
				reminders.deleted.forEach(({ reminder, person }) => {
					virtualItems.push({
						type: "reminder",
						reminder,
						person,
					})
				})
			}

			virtualItems.push({ type: "spacer" })
		}
	}

	// eslint-disable-next-line react-hooks/incompatible-library
	let virtualizer = useVirtualizer({
		count: virtualItems.length,
		getScrollElement: () => document.getElementById("scroll-area"),
		rangeExtractor: range => {
			return [0, 1, ...defaultRangeExtractor(range).filter(i => i > 1)]
		},
		estimateSize: () => 100,
		overscan: 5,
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
							itemIsReminder && nextItemIsReminder && "border-border border-b",
						)}
						style={{ transform: `translateY(${virtualRow.start}px)` }}
					>
						{renderVirtualItem(item, {
							searchQuery,
							userId: currentMe.$jazz.id,
						})}
					</div>
				)
			})}
		</div>
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
	| {
			type: "section-heading"
			section: "done" | "deleted"
			count: number
	  }
	| { type: "no-results"; searchQuery: string }
	| { type: "no-reminders" }
	| { type: "all-caught-up" }
	| { type: "spacer" }

function renderVirtualItem(
	item: VirtualItem,
	options: { searchQuery: string; userId: string },
): ReactNode {
	switch (item.type) {
		case "heading":
			return <HeadingSection />

		case "search":
			return <SearchSection />

		case "reminder":
			return (
				<ReminderListItem
					reminder={item.reminder}
					person={item.person}
					userId={options.userId}
					searchQuery={options.searchQuery}
				/>
			)

		case "section-heading":
			return <SectionHeading section={item.section} count={item.count} />

		case "no-results":
			return <NoSearchResultsState searchQuery={item.searchQuery} />

		case "no-reminders":
			return <NoRemindersState />

		case "all-caught-up":
			return <AllCaughtUpState />

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

function SearchSection() {
	let { remindersSearchQuery, setRemindersSearchQuery } = useAppStore()
	let autoFocusRef = useAutoFocusInput() as RefObject<HTMLInputElement>
	let t = useIntl()

	return (
		<div className="my-6 flex items-center justify-end gap-3">
			<div className="relative w-full">
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
				<Input
					ref={autoFocusRef}
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

function SectionHeading({
	section,
	count,
}: {
	section: "done" | "deleted"
	count: number
}) {
	let key: "reminders.done.heading" | "reminders.deleted.heading" =
		section === "done" ? "reminders.done.heading" : "reminders.deleted.heading"

	return (
		<TypographyH2 className="text-xl first:mt-10">
			<T k={key} params={{ count }} />
		</TypographyH2>
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
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
				<Search className="text-muted-foreground size-8" />
				<div className="space-y-2">
					<p className="text-muted-foreground text-lg">
						<T
							k="reminders.noResults.message"
							params={{ query: searchQuery }}
						/>
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="reminders.noResults.suggestion" />
					</p>
				</div>
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

function Spacer() {
	return <div className="h-20" />
}
