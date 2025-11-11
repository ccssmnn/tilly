import { createFileRoute, notFound, Link } from "@tanstack/react-router"
import { z } from "zod"
import { useCoState } from "jazz-tools/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#shared/ui/tabs"
import { Person, Note, Reminder, isDueToday } from "#shared/schema/user"
import { usePersonNotes } from "#app/features/note-hooks"
import { usePersonReminders } from "#app/features/reminder-hooks"
import { co, type ResolveQuery } from "jazz-tools"
import { useState, useDeferredValue, useId } from "react"
import { FileEarmarkText, Plus, Bell, X, Search } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { PersonDetails } from "#app/features/person-details"
import { NoteListItem } from "#app/features/note-list-item"
import { NoteForm } from "#app/features/note-form"
import { ReminderListItem } from "#app/features/reminder-list-item"
import { ReminderForm } from "#app/features/reminder-form"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { createReminder } from "#shared/tools/reminder-create"
import { createNote } from "#shared/tools/note-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { cn } from "#app/lib/utils"
import { useIsMobile } from "#app/hooks/use-mobile"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"

import { T, useIntl } from "#shared/intl/setup"
import { NoteTour } from "#app/features/note-tour"
import { ReminderTour } from "#app/features/reminder-tour"

export const Route = createFileRoute("/_app/people/$personID")({
	validateSearch: z.object({
		tab: z.enum(["notes", "reminders"]).optional().default("notes"),
	}),
	loader: async ({ params }) => {
		let person = await Person.load(params.personID, {
			resolve: query,
		})
		if (!person) throw notFound()
		return { person }
	},
	component: PersonScreen,
})

let query = {
	avatar: true,
	notes: { $each: true },
	reminders: { $each: true },
} as const satisfies ResolveQuery<typeof Person>

function PersonScreen() {
	let { me } = Route.useRouteContext()
	let { personID } = Route.useParams()
	let data = Route.useLoaderData()
	let subscribedPerson = useCoState(Person, personID, {
		resolve: query,
	})
	let person = subscribedPerson ?? data.person
	let { tab } = Route.useSearch()
	let isMobile = useIsMobile()
	let [searchQuery, setSearchQuery] = useState("")
	let deferredSearchQuery = useDeferredValue(searchQuery)
	let autoFocusRef = useAutoFocusInput()
	let t = useIntl()
	let notes = usePersonNotes(person, deferredSearchQuery)
	let searchInputId = useId()

	let reminders = usePersonReminders(person, deferredSearchQuery)
	let hasDueReminders = reminders.open.some(reminder => isDueToday(reminder))

	if (!me) {
		return (
			<div className="relative space-y-8 pb-20 md:mt-12 md:pb-4">
				<title>{t("person.detail.pageTitle", { name: person.name })}</title>
				<div className="text-center">
					<p>Please sign in to view person details.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="relative space-y-8 pb-20 md:mt-12 md:pb-4">
			<title>{t("person.detail.pageTitle", { name: person.name })}</title>
			<PersonDetails person={person} me={me} />

			<div className="space-y-6">
				<div className="flex flex-1 items-center gap-2">
					<div className="relative flex-1">
						<label htmlFor={searchInputId} className="sr-only">
							{t("person.detail.search.placeholder")}
						</label>
						<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
						<Input
							ref={r => {
								autoFocusRef.current = r
							}}
							id={searchInputId}
							name="person-detail-search"
							type="search"
							enterKeyHint="search"
							placeholder={t("person.detail.search.placeholder")}
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="flex-1 pl-10"
						/>
					</div>
					{searchQuery !== "" ? (
						<Button variant="outline" onClick={() => setSearchQuery("")}>
							<X />
							<span className="sr-only md:not-sr-only">
								<T k="common.clear" />
							</span>
						</Button>
					) : null}
				</div>
				<Tabs value={tab}>
					<div className="mb-6 flex items-center justify-between gap-3">
						<TabsList className="flex-1">
							<TabsTrigger value="notes" asChild>
								<Link
									to={Route.fullPath}
									params={{ personID: person.$jazz.id }}
									search={{ tab: "notes" }}
									className="flex items-center gap-1"
									replace
									resetScroll={false}
								>
									<FileEarmarkText />
									<span className={cn(isMobile && tab !== "notes" && "hidden")}>
										<T
											k="person.detail.notes.tab"
											params={{ count: notes.active.length }}
										/>
									</span>
								</Link>
							</TabsTrigger>
							<TabsTrigger value="reminders" asChild>
								<Link
									to={Route.fullPath}
									params={{ personID: person.$jazz.id }}
									search={{ tab: "reminders" }}
									className="flex items-center gap-1"
									replace
									resetScroll={false}
								>
									<div className="relative">
										<Bell />
										{hasDueReminders && (
											<div className="bg-primary absolute top-0 right-0 size-2 rounded-full" />
										)}
									</div>
									<span
										className={cn(isMobile && tab !== "reminders" && "hidden")}
									>
										<T
											k="person.detail.reminders.tab"
											params={{ count: reminders.open.length }}
										/>
									</span>
								</Link>
							</TabsTrigger>
						</TabsList>
						<AddItemButton
							person={person}
							activeTab={tab}
							userId={me?.$jazz.id ?? ""}
							onItemCreated={() => setSearchQuery("")}
						/>
					</div>
					<TabsContent value="notes">
						<NotesList
							notes={notes}
							person={person}
							searchQuery={deferredSearchQuery}
						/>
					</TabsContent>
					<TabsContent value="reminders">
						<RemindersList
							reminders={reminders}
							person={person}
							userId={me?.$jazz.id ?? ""}
							searchQuery={deferredSearchQuery}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}

function NotesList({
	notes,
	person,
	searchQuery,
}: {
	notes: {
		active: Array<{
			type: "note"
			item: co.loaded<typeof Note>
			timestamp: Date
			priority: "high" | "normal"
		}>
		deleted: Array<{
			type: "note"
			item: co.loaded<typeof Note>
			timestamp: Date
			priority: "high" | "normal"
		}>
	}
	person: co.loaded<typeof Person, typeof query>
	searchQuery: string
}) {
	let didSearch = !!searchQuery
	let hasMoreNotes = notes.deleted.length > 0

	if (notes.active.length === 0 && notes.deleted.length === 0) {
		if (!searchQuery) {
			return <NoteTour onSuccess={() => {}} personId={person.$jazz.id} />
		}

		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<FileEarmarkText className="text-muted-foreground size-8" />
				<p className="text-muted-foreground mt-4 text-lg">
					<T k="notes.empty.withSearch" params={{ query: searchQuery }} />
				</p>
				<p className="text-muted-foreground text-sm">
					<T k="notes.empty.suggestion.withSearch" />
				</p>
			</div>
		)
	}

	return (
		<>
			{notes.active.map(entry => (
				<NoteListItem
					key={entry.item.$jazz.id}
					note={entry.item}
					person={person}
					searchQuery={searchQuery}
					showPerson={false}
				/>
			))}

			{hasMoreNotes && !didSearch && (
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
								{notes.deleted.map(entry => (
									<NoteListItem
										key={entry.item.$jazz.id}
										note={entry.item}
										person={person}
										searchQuery={searchQuery}
										showPerson={false}
									/>
								))}
							</AccordionContent>
						</AccordionItem>
					)}
				</Accordion>
			)}

			{didSearch && hasMoreNotes && (
				<>
					{notes.deleted.length > 0 && (
						<>
							<h3 className="text-muted-foreground mt-8 text-sm font-medium">
								<T
									k="notes.deleted.heading"
									params={{ count: notes.deleted.length }}
								/>
							</h3>
							{notes.deleted.map(entry => (
								<NoteListItem
									key={entry.item.$jazz.id}
									note={entry.item}
									person={person}
									searchQuery={searchQuery}
									showPerson={false}
								/>
							))}
						</>
					)}
				</>
			)}
		</>
	)
}

function RemindersList({
	reminders,
	person,
	userId,
	searchQuery,
}: {
	reminders: {
		open: Array<co.loaded<typeof Reminder>>
		done: Array<co.loaded<typeof Reminder>>
		deleted: Array<co.loaded<typeof Reminder>>
	}
	person: co.loaded<typeof Person, typeof query>
	userId: string
	searchQuery: string
}) {
	let didSearch = !!searchQuery
	let hasMoreReminders =
		reminders.done.length > 0 || reminders.deleted.length > 0

	if (
		reminders.open.length === 0 &&
		reminders.done.length === 0 &&
		reminders.deleted.length === 0
	) {
		if (!searchQuery) {
			return <ReminderTour onSuccess={() => {}} personId={person.$jazz.id} />
		}

		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Bell className="text-muted-foreground size-8" />
				<p className="text-muted-foreground mt-4 text-lg">
					<T k="reminders.empty.withSearch" params={{ query: searchQuery }} />
				</p>
				<p className="text-muted-foreground text-sm">
					<T k="reminders.empty.suggestion.withSearch" />
				</p>
			</div>
		)
	}

	return (
		<>
			{reminders.open.map(reminder => (
				<ReminderListItem
					key={reminder.$jazz.id}
					reminder={reminder}
					person={person}
					userId={userId}
					showPerson={false}
					searchQuery={searchQuery}
				/>
			))}

			{hasMoreReminders && !didSearch && (
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
								{reminders.done.map(reminder => (
									<ReminderListItem
										key={reminder.$jazz.id}
										reminder={reminder}
										person={person}
										userId={userId}
										showPerson={false}
										searchQuery={searchQuery}
									/>
								))}
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
								{reminders.deleted.map(reminder => (
									<ReminderListItem
										key={reminder.$jazz.id}
										reminder={reminder}
										person={person}
										userId={userId}
										showPerson={false}
										searchQuery={searchQuery}
									/>
								))}
							</AccordionContent>
						</AccordionItem>
					)}
				</Accordion>
			)}

			{didSearch && hasMoreReminders && (
				<>
					{reminders.done.length > 0 && (
						<>
							<h3 className="text-muted-foreground mt-8 text-sm font-medium">
								<T
									k="reminders.done.heading"
									params={{ count: reminders.done.length }}
								/>
							</h3>
							{reminders.done.map(reminder => (
								<ReminderListItem
									key={reminder.$jazz.id}
									reminder={reminder}
									person={person}
									userId={userId}
									showPerson={false}
									searchQuery={searchQuery}
								/>
							))}
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
							{reminders.deleted.map(reminder => (
								<ReminderListItem
									key={reminder.$jazz.id}
									reminder={reminder}
									person={person}
									userId={userId}
									showPerson={false}
									searchQuery={searchQuery}
								/>
							))}
						</>
					)}
				</>
			)}
		</>
	)
}

function AddItemButton(props: {
	person: co.loaded<typeof Person, typeof query>
	activeTab: "notes" | "reminders"
	userId: string
	onItemCreated: () => void
}) {
	let navigate = Route.useNavigate()
	let [noteOpen, setNoteOpen] = useState(false)
	let [reminderOpen, setReminderOpen] = useState(false)
	let t = useIntl()

	async function handleAddNote(data: { content: string; pinned: boolean }) {
		let result = await tryCatch(createNote(props.person.$jazz.id, data))
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		navigate({ search: prev => ({ ...prev, tab: "notes" }) })
		setNoteOpen(false)
		props.onItemCreated()
		toast.success(t("notes.created.success"))
	}

	async function handleAddReminder(data: {
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
				personId: props.person.$jazz.id,
				userId: props.userId,
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		navigate({ search: prev => ({ ...prev, tab: "reminders" }) })
		setReminderOpen(false)
		props.onItemCreated()
		toast.success(t("reminders.created.success"))
	}

	function handleButtonClick() {
		if (props.activeTab === "notes") {
			setNoteOpen(true)
		} else {
			setReminderOpen(true)
		}
	}

	return (
		<>
			<Button
				onClick={handleButtonClick}
				data-testid={
					props.activeTab === "notes"
						? "add-note-button"
						: "add-reminder-button"
				}
			>
				<Plus />
				<span className="hidden md:inline">
					{props.activeTab === "notes" ? (
						<T k="person.detail.addNote" />
					) : (
						<T k="person.detail.addReminder" />
					)}
				</span>
			</Button>

			<Dialog open={noteOpen} onOpenChange={setNoteOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="note.add.title" />
							</DialogTitle>
							<DialogDescription>
								<T
									k="note.add.description"
									params={{ person: props.person.name }}
								/>
							</DialogDescription>
						</DialogHeader>
					}
				>
					<NoteForm
						onSubmit={handleAddNote}
						onCancel={() => setNoteOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="reminders.add.title" />
							</DialogTitle>
							<DialogDescription>
								<T k="reminders.add.description" />
							</DialogDescription>
						</DialogHeader>
					}
				>
					<ReminderForm
						defaultValues={{
							text: "",
							dueAtDate: new Date().toISOString().substring(0, 10),
						}}
						onSubmit={handleAddReminder}
						onCancel={() => setReminderOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
