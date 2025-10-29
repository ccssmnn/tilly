import { createFileRoute, notFound } from "@tanstack/react-router"
import { UserAccount, Person, isDeleted } from "#shared/schema/user"
import { useReminders } from "#app/features/reminder-hooks"
import { useAccount } from "jazz-tools/react"
import { co, type ResolveQuery } from "jazz-tools"
import { ReminderListItem } from "#app/features/reminder-list-item"
import { ReminderForm } from "#app/features/reminder-form"
import { TypographyH1 } from "#shared/ui/typography"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Plus, X, Search, Bell, People } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useState, useDeferredValue, type ReactNode } from "react"
import { Combobox } from "#shared/ui/combobox"
import { useAppStore } from "#app/lib/store"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"
import { createReminder } from "#shared/tools/reminder-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { NewPerson } from "#app/features/new-person"
import { SignInPrompt } from "#app/features/auth-prompt"
import { T, useIntl } from "#shared/intl/setup"
import { calculateEagerLoadCount } from "#shared/lib/viewport-utils"

export let Route = createFileRoute("/_app/reminders")({
	loader: async ({ context }) => {
		let eagerCount = calculateEagerLoadCount()
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
	let people = (currentMe?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let { remindersSearchQuery } = useAppStore()
	let deferredSearchQuery = useDeferredValue(remindersSearchQuery)
	let reminders = useReminders(people, deferredSearchQuery)

	// Early return for no people - no controls needed
	if (people.length === 0) {
		return (
			<RemindersLayout>
				<NoPeopleState />
			</RemindersLayout>
		)
	}

	if (reminders.total === 0) {
		return (
			<RemindersLayout>
				<NoRemindersState people={people} currentMe={currentMe} />
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
				<RemindersControls people={people} currentMe={currentMe} />
				<NoSearchResultsState searchQuery={deferredSearchQuery} />
			</RemindersLayout>
		)
	}

	if (!didSearch && !hasMatches) {
		return (
			<RemindersLayout>
				<RemindersControls people={people} currentMe={currentMe} />
				<AllCaughtUpState />
			</RemindersLayout>
		)
	}

	return (
		<RemindersLayout>
			<RemindersControls people={people} currentMe={currentMe} />
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

function RemindersControls({
	people,
	currentMe,
}: {
	people: Array<co.loaded<typeof Person>>
	currentMe: co.loaded<typeof UserAccount>
}) {
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
			<AddReminder people={people} currentMe={currentMe} />
		</div>
	)
}

function NoPeopleState() {
	return (
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-around gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
			<div className="space-y-4">
				<People className="text-muted-foreground mx-auto size-12" />
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">
						<T k="reminders.noPeople.title" />
					</h2>
					<p className="text-muted-foreground">
						<T k="reminders.noPeople.description" />
					</p>
				</div>
				<NewPerson>
					<Button className="mt-2">
						<T k="reminders.noPeople.addButton" />
					</Button>
				</NewPerson>
			</div>
			<SignInPrompt />
		</div>
	)
}

function NoRemindersState({
	people,
	currentMe,
}: {
	people: Array<co.loaded<typeof Person>>
	currentMe: co.loaded<typeof UserAccount>
}) {
	return (
		<div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
			<Bell className="text-muted-foreground size-8" />
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">
					<T k="reminders.noReminders.title" />
				</h2>
				<p className="text-muted-foreground">
					<T k="reminders.noReminders.description" />
				</p>
			</div>
			<AddReminder people={people} currentMe={currentMe} />
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

function AddReminder({
	people,
	currentMe,
}: {
	people: Array<co.loaded<typeof Person>>
	currentMe: co.loaded<typeof UserAccount>
}) {
	let t = useIntl()
	let { setRemindersSearchQuery } = useAppStore()
	let [selectedPersonId, setSelectedPersonId] = useState<string>("")
	let [addReminderDialogOpen, setAddReminderDialogOpen] = useState(false)

	// Prepare people options for combobox
	let peopleOptions = people
		.filter(person => person && !isDeleted(person))
		.map(person => ({
			value: person.$jazz.id,
			label: person.name,
		}))

	let selectedPersonLabel =
		peopleOptions.find(personOption => personOption.value === selectedPersonId)
			?.label ?? ""

	function handleAddReminder() {
		if (peopleOptions.length === 0) return
		setSelectedPersonId("")
		setAddReminderDialogOpen(true)
	}

	function handlePersonSelected(personId: string) {
		setSelectedPersonId(personId)
	}

	async function handleReminderSubmit(data: {
		text: string
		dueAtDate: string
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	}) {
		let reminderData = {
			text: data.text,
			dueAtDate: data.dueAtDate,
			repeat: data.repeat,
		}

		let result = await tryCatch(
			createReminder(reminderData, {
				personId: selectedPersonId,
				userId: currentMe?.$jazz.id ?? "",
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		setAddReminderDialogOpen(false)
		setSelectedPersonId("")
		setRemindersSearchQuery("")
		toast.success(t("reminders.created.success"))
	}

	return (
		<>
			<Button onClick={handleAddReminder} disabled={peopleOptions.length === 0}>
				<Plus className="size-4" />
				<span className="sr-only md:not-sr-only">
					<T k="reminders.addButton" />
				</span>
			</Button>

			<Dialog
				open={addReminderDialogOpen}
				onOpenChange={setAddReminderDialogOpen}
			>
				<DialogContent
					titleSlot={
						<div className="relative overflow-hidden">
							<div
								className={`transition-all duration-300 ease-out ${
									!selectedPersonId
										? "translate-x-0 opacity-100"
										: "absolute inset-0 -translate-x-full opacity-0"
								}`}
							>
								<DialogHeader>
									<DialogTitle>
										<T k="reminder.select.title" />
									</DialogTitle>
									<DialogDescription>
										<T k="reminder.select.description" />
									</DialogDescription>
								</DialogHeader>
							</div>

							<div
								className={`transition-all duration-300 ease-out ${
									selectedPersonId
										? "translate-x-0 opacity-100"
										: "absolute inset-0 translate-x-full opacity-0"
								}`}
							>
								<DialogHeader>
									<DialogTitle>
										<T k="reminder.add.title" />
									</DialogTitle>
									<DialogDescription>
										<T
											k="reminder.add.description"
											params={{ person: selectedPersonLabel }}
										/>
									</DialogDescription>
								</DialogHeader>
							</div>
						</div>
					}
				>
					<div className="relative overflow-hidden">
						<div
							className={`transition-all duration-300 ease-out ${
								!selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 -translate-x-full opacity-0"
							}`}
						>
							<div className="space-y-4">
								<Combobox
									items={peopleOptions}
									value={selectedPersonId}
									onValueChange={handlePersonSelected}
									placeholder={t("reminder.select.placeholder")}
									emptyText={t("reminder.select.empty")}
									searchPlaceholder={t("reminder.select.search")}
								/>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() => setAddReminderDialogOpen(false)}
									>
										<T k="common.cancel" />
									</Button>
								</div>
							</div>
						</div>

						<div
							className={`transition-all duration-300 ease-out ${
								selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 translate-x-full opacity-0"
							}`}
						>
							<ReminderForm
								defaultValues={{
									text: "",
									dueAtDate: new Date().toISOString().substring(0, 10),
								}}
								onSubmit={handleReminderSubmit}
								onCancel={() => {
									setAddReminderDialogOpen(false)
									setSelectedPersonId("")
								}}
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
