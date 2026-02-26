import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"
import { useCoState } from "jazz-tools/react"
import { Tabs, TabsContent } from "#shared/ui/tabs"
import {
	Person,
	Note,
	Reminder,
	UserAccount,
	isDueToday,
} from "#shared/schema/user"
import { usePersonNotes } from "#app/features/note-hooks"
import { usePersonReminders } from "#app/features/reminder-hooks"
import { co, type ResolveQuery } from "jazz-tools"
import { useState, useDeferredValue, useId } from "react"
import {
	FileEarmarkText,
	Plus,
	Bell,
	X,
	Search,
	ShieldSlash,
	Collection,
	Sliders,
	Trash,
	Check,
	ChevronDown,
} from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { PersonDetails } from "#app/features/person-details"
import { NoteListItem } from "#app/features/note-list-item"
import { NoteForm } from "#app/features/note-form"
import { ReminderListItem } from "#app/features/reminder-list-item"
import { ReminderForm } from "#app/features/reminder-form"
import { Button } from "#shared/ui/button"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#shared/ui/input-group"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "#shared/ui/drawer"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"
import { createReminder } from "#shared/tools/reminder-create"
import { createNote } from "#shared/tools/note-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { NoteTour } from "#app/features/note-tour"
import { ReminderTour } from "#app/features/reminder-tour"

export const Route = createFileRoute("/_app/people/$personID")({
	validateSearch: z.object({
		tab: z.enum(["notes", "reminders"]).optional().default("notes"),
	}),
	loader: async ({ params }) => {
		let person = await Person.load(params.personID, { resolve })
		if (!person.$isLoaded) {
			return {
				person: null,
				loadingState: person.$jazz.loadingState as
					| "unauthorized"
					| "unavailable",
			}
		}
		return { person, loadingState: null }
	},
	component: PersonScreen,
})

let resolve = {
	avatar: true,
	notes: { $each: { $onError: "catch" } },
	reminders: { $each: { $onError: "catch" } },
} as const satisfies ResolveQuery<typeof Person>

function PersonScreen() {
	let { me } = Route.useRouteContext()
	let { personID } = Route.useParams()
	let data = Route.useLoaderData()
	let { tab } = Route.useSearch()
	let navigate = Route.useNavigate()

	let subscribedPerson = useCoState(Person, personID, { resolve })
	let [searchQuery, setSearchQuery] = useState("")
	let deferredSearchQuery = useDeferredValue(searchQuery)
	let autoFocusRef = useAutoFocusInput()
	let t = useIntl()
	let searchInputId = useId()

	let [notesStatusFilter, setNotesStatusFilter] = useState<
		"active" | "deleted"
	>("active")
	let [remindersStatusFilter, setRemindersStatusFilter] = useState<
		"active" | "done" | "deleted"
	>("active")

	let notes = usePersonNotes(personID, deferredSearchQuery, undefined, {
		statusFilter: notesStatusFilter,
	})
	let reminders = usePersonReminders(personID, deferredSearchQuery, undefined, {
		statusFilter: remindersStatusFilter,
	})
	// For due reminder indicator, we need to check active reminders
	let activeReminders = usePersonReminders(personID, "", undefined, {
		statusFilter: "active",
	})

	// Handle initial load states from loader
	if (!data.person) {
		if (data.loadingState === "unauthorized") {
			return <PersonUnauthorized />
		}
		return <PersonNotFound />
	}

	// Handle live access revocation (ignore "loading" state - use loader data as fallback)
	if (
		!subscribedPerson.$isLoaded &&
		subscribedPerson.$jazz.loadingState !== "loading"
	) {
		if (subscribedPerson.$jazz.loadingState === "unauthorized") {
			return <PersonUnauthorized />
		}
		return <PersonNotFound />
	}

	let person = subscribedPerson.$isLoaded ? subscribedPerson : data.person
	let hasDueReminders = activeReminders.some(reminder => isDueToday(reminder))

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
					<TabSwitcherButton
						tab={tab}
						hasDueReminders={hasDueReminders}
						notesCount={notes.length}
						remindersCount={reminders.length}
						onTabChange={nextTab =>
							navigate({
								search: prev => ({ ...prev, tab: nextTab }),
								replace: true,
								resetScroll: false,
							})
						}
					/>
					<div className="flex-1">
						<label htmlFor={searchInputId} className="sr-only">
							{t("person.detail.search.placeholder")}
						</label>
						<InputGroup>
							<InputGroupInput
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
							/>
							<InputGroupAddon align="inline-start">
								<Search className="size-4" />
							</InputGroupAddon>
							{searchQuery !== "" ? (
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										variant="ghost"
										size="icon-xs"
										aria-label={t("common.clear")}
										onClick={() => setSearchQuery("")}
									>
										<X />
									</InputGroupButton>
								</InputGroupAddon>
							) : null}
							<InputGroupAddon align="inline-end">
								<StatusFilterButton
									statusOptions={
										tab === "notes"
											? [
													{ value: "active", label: t("filter.status.active") },
													{
														value: "deleted",
														label: t("filter.status.deleted"),
													},
												]
											: [
													{ value: "active", label: t("filter.status.active") },
													{ value: "done", label: t("filter.status.done") },
													{
														value: "deleted",
														label: t("filter.status.deleted"),
													},
												]
									}
									statusFilter={
										tab === "notes" ? notesStatusFilter : remindersStatusFilter
									}
									onStatusFilterChange={filter =>
										tab === "notes"
											? setNotesStatusFilter(filter as "active" | "deleted")
											: setRemindersStatusFilter(
													filter as "active" | "done" | "deleted",
												)
									}
								/>
							</InputGroupAddon>
						</InputGroup>
					</div>
					<AddItemButton
						person={person}
						activeTab={tab}
						me={me}
						onItemCreated={() => setSearchQuery("")}
					/>
				</div>
				<Tabs value={tab}>
					<TabsContent value="notes">
						<NotesList
							notes={notes}
							person={person}
							searchQuery={deferredSearchQuery}
							statusFilter={notesStatusFilter}
						/>
					</TabsContent>
					<TabsContent value="reminders">
						<RemindersList
							reminders={reminders}
							person={person}
							me={me}
							searchQuery={deferredSearchQuery}
							statusFilter={remindersStatusFilter}
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
	statusFilter,
}: {
	notes: Array<co.loaded<typeof Note>>
	person: co.loaded<typeof Person, typeof resolve>
	searchQuery: string
	statusFilter: "active" | "deleted"
}) {
	if (notes.length === 0) {
		if (!searchQuery) {
			if (statusFilter === "deleted") {
				return (
					<div className="flex flex-col items-center justify-center py-12">
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
			return <NoteTour onSuccess={() => {}} personId={person.$jazz.id} />
		}

		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileEarmarkText />
						</EmptyMedia>
						<EmptyTitle>
							<T k="notes.empty.withSearch" params={{ query: searchQuery }} />
						</EmptyTitle>
						<EmptyDescription>
							<T k="notes.empty.suggestion.withSearch" />
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<>
			{notes.map(entry => (
				<NoteListItem
					key={entry.$jazz.id}
					note={entry}
					person={person}
					searchQuery={searchQuery}
					showPerson={false}
				/>
			))}
		</>
	)
}

function TabSwitcherButton({
	tab,
	hasDueReminders,
	notesCount,
	remindersCount,
	onTabChange,
}: {
	tab: "notes" | "reminders"
	hasDueReminders: boolean
	notesCount: number
	remindersCount: number
	onTabChange: (tab: "notes" | "reminders") => void
}) {
	let t = useIntl()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="outline" className="shrink-0">
						<div className="relative">
							{tab === "notes" ? <FileEarmarkText /> : <Bell />}
							{tab === "reminders" && hasDueReminders && (
								<div className="bg-primary absolute top-0 right-0 size-2 rounded-full" />
							)}
						</div>
						<span className="hidden md:inline">
							{tab === "notes"
								? t("person.detail.notes.tab", { count: notesCount })
								: t("person.detail.reminders.tab", { count: remindersCount })}
						</span>
						<ChevronDown className="size-3 opacity-70" />
					</Button>
				}
			/>
			<DropdownMenuContent align="start">
				<DropdownMenuItem onClick={() => onTabChange("notes")}>
					<FileEarmarkText />
					<T k="person.detail.notes.tab" params={{ count: notesCount }} />
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onTabChange("reminders")}>
					<div className="relative">
						<Bell />
						{hasDueReminders && (
							<div className="bg-primary absolute top-0 right-0 size-2 rounded-full" />
						)}
					</div>
					<T
						k="person.detail.reminders.tab"
						params={{ count: remindersCount }}
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function StatusFilterButton({
	statusOptions,
	statusFilter,
	onStatusFilterChange,
}: {
	statusOptions: { value: string; label: string }[]
	statusFilter: string
	onStatusFilterChange: (filter: string) => void
}) {
	let hasNonDefaultFilters = statusFilter !== "active"

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<InputGroupButton
						variant={hasNonDefaultFilters ? "secondary" : "ghost"}
						size="icon-xs"
						aria-label="Status filter"
					>
						{hasNonDefaultFilters ? <Sliders /> : <Collection />}
					</InputGroupButton>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<T k="filter.status" />
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuRadioGroup
					value={statusFilter}
					onValueChange={onStatusFilterChange}
				>
					{statusOptions.map(option => (
						<DropdownMenuRadioItem key={option.value} value={option.value}>
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function RemindersList({
	reminders,
	person,
	me,
	searchQuery,
	statusFilter,
}: {
	reminders: Array<co.loaded<typeof Reminder>>
	person: co.loaded<typeof Person, typeof resolve>
	me: co.loaded<typeof UserAccount>
	searchQuery: string
	statusFilter: "active" | "done" | "deleted"
}) {
	if (reminders.length === 0) {
		if (!searchQuery) {
			if (statusFilter === "deleted") {
				return (
					<div className="flex flex-col items-center justify-center py-12">
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
			if (statusFilter === "done") {
				return (
					<div className="flex flex-col items-center justify-center py-12">
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
			return <ReminderTour onSuccess={() => {}} personId={person.$jazz.id} />
		}

		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Bell />
						</EmptyMedia>
						<EmptyTitle>
							<T
								k="reminders.empty.withSearch"
								params={{ query: searchQuery }}
							/>
						</EmptyTitle>
						<EmptyDescription>
							<T k="reminders.empty.suggestion.withSearch" />
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<>
			{reminders.map(reminder => (
				<ReminderListItem
					key={reminder.$jazz.id}
					reminder={reminder}
					person={person}
					me={me}
					showPerson={false}
					searchQuery={searchQuery}
				/>
			))}
		</>
	)
}

function AddItemButton(props: {
	person: co.loaded<typeof Person, typeof resolve>
	activeTab: "notes" | "reminders"
	me: co.loaded<typeof UserAccount>
	onItemCreated: () => void
}) {
	let navigate = Route.useNavigate()
	let [noteOpen, setNoteOpen] = useState(false)
	let [reminderOpen, setReminderOpen] = useState(false)
	let t = useIntl()

	async function handleAddNote(data: { content: string; pinned: boolean }) {
		let result = await tryCatch(
			createNote(
				{ title: "", ...data },
				{
					personId: props.person.$jazz.id,
					worker: props.me,
				},
			),
		)
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
				worker: props.me,
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
			return
		}
		setReminderOpen(true)
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

			<Drawer open={noteOpen} onOpenChange={setNoteOpen}>
				<DrawerContent contentClassName="max-w-lg">
					<DrawerHeader>
						<DrawerTitle>
							<T k="note.add.title" />
						</DrawerTitle>
					</DrawerHeader>
					<NoteForm
						onSubmit={handleAddNote}
						onCancel={() => setNoteOpen(false)}
					/>
				</DrawerContent>
			</Drawer>

			<Drawer open={reminderOpen} onOpenChange={setReminderOpen}>
				<DrawerContent contentClassName="max-w-lg">
					<DrawerHeader>
						<DrawerTitle>
							<T k="reminders.add.title" />
						</DrawerTitle>
					</DrawerHeader>
					<ReminderForm
						defaultValues={{
							text: "",
							dueAtDate: new Date().toISOString().substring(0, 10),
						}}
						onSubmit={handleAddReminder}
						onCancel={() => setReminderOpen(false)}
					/>
				</DrawerContent>
			</Drawer>
		</>
	)
}

function PersonNotFound() {
	return (
		<div className="flex flex-col items-center justify-center py-12 md:mt-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<span className="text-3xl font-bold">404</span>
					</EmptyMedia>
					<EmptyTitle>
						<T k="person.notFound.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="person.notFound.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => window.history.back()}>
							<T k="person.notFound.goBack" />
						</Button>
						<Button>
							<Link to="/people">
								<T k="person.notFound.goToPeople" />
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function PersonUnauthorized() {
	return (
		<div className="flex flex-col items-center justify-center py-12 md:mt-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ShieldSlash />
					</EmptyMedia>
					<EmptyTitle>
						<T k="person.unauthorized.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="person.unauthorized.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => window.history.back()}>
							<T k="person.unauthorized.goBack" />
						</Button>
						<Button>
							<Link to="/people">
								<T k="person.unauthorized.goToPeople" />
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}
