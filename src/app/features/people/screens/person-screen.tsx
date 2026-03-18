import { useState, useDeferredValue } from "react"
import { useCoState, useAccount } from "jazz-tools/react"
import { Person, UserAccount } from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"
import { useIntl } from "#shared/intl/setup"
import { PersonDetails } from "../widgets/person-details"
import {
	usePersonNotes,
	usePersonReminders,
	usePersonHasDueReminders,
	type PersonLoadingState,
} from "../lib/person-detail-data"
import {
	PersonTabToolbar,
	PersonTabSwitcher,
	PersonSearchInput,
	PersonStatusFilter,
} from "../parts/person-tab-toolbar"
import { PersonNotFound, PersonUnauthorized } from "../parts/person-fallbacks"
import { PersonNotesList } from "../widgets/person-notes-list"
import { PersonRemindersList } from "../widgets/person-reminders-list"
import { NewPersonNote } from "../widgets/new-person-note"
import { NewPersonReminder } from "../widgets/new-person-reminder"

export { PersonScreen }

let resolve = {
	avatar: true,
	notes: { $each: { $onError: "catch" } },
	reminders: { $each: { $onError: "catch" } },
} as const satisfies ResolveQuery<typeof Person>

type PersonScreenProps = {
	personId: string
	loaderPerson: co.loaded<typeof Person, typeof resolve> | null
	loadingState: PersonLoadingState
	tab: "notes" | "reminders"
	onTabChange: (tab: "notes" | "reminders") => void
}

function PersonScreen({
	personId,
	loaderPerson,
	loadingState,
	tab,
	onTabChange,
}: PersonScreenProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)

	let subscribedPerson = useCoState(Person, personId, { resolve })
	let [searchQuery, setSearchQuery] = useState("")
	let deferredSearchQuery = useDeferredValue(searchQuery)

	let [notesStatusFilter, setNotesStatusFilter] = useState<
		"active" | "deleted"
	>("active")
	let [remindersStatusFilter, setRemindersStatusFilter] = useState<
		"active" | "done" | "deleted"
	>("active")

	let notes = usePersonNotes(personId, deferredSearchQuery, notesStatusFilter)
	let reminders = usePersonReminders(
		personId,
		deferredSearchQuery,
		remindersStatusFilter,
	)
	let hasDueReminders = usePersonHasDueReminders(personId)

	if (!loaderPerson) {
		if (loadingState === "unauthorized") return <PersonUnauthorized />
		return <PersonNotFound />
	}

	if (
		!subscribedPerson.$isLoaded &&
		subscribedPerson.$jazz.loadingState !== "loading"
	) {
		if (subscribedPerson.$jazz.loadingState === "unauthorized") {
			return <PersonUnauthorized />
		}
		return <PersonNotFound />
	}

	let person = subscribedPerson.$isLoaded ? subscribedPerson : loaderPerson

	if (!me.$isLoaded) {
		return (
			<div className="relative space-y-8 pb-20 md:mt-12 md:pb-4">
				<title>{t("person.detail.pageTitle", { name: person.name })}</title>
				<div className="text-center">
					<p>Please sign in to view person details.</p>
				</div>
			</div>
		)
	}

	let notesStatusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	let remindersStatusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "done", label: t("filter.status.done") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	return (
		<div className="relative space-y-8 pb-20 md:mt-12 md:pb-4">
			<title>{t("person.detail.pageTitle", { name: person.name })}</title>
			<PersonDetails person={person} me={me} />

			<div className="space-y-6">
				<PersonTabToolbar>
					<PersonTabSwitcher
						tab={tab}
						hasDueReminders={hasDueReminders}
						notesCount={notes.length}
						remindersCount={reminders.length}
						onTabChange={onTabChange}
					/>
					<PersonSearchInput
						query={searchQuery}
						onChange={setSearchQuery}
						trailing={
							<PersonStatusFilter
								statusOptions={
									tab === "notes" ? notesStatusOptions : remindersStatusOptions
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
						}
					/>
					{tab === "notes" ? (
						<NewPersonNote
							person={person}
							onCreated={() => setSearchQuery("")}
						/>
					) : (
						<NewPersonReminder
							person={person}
							onCreated={() => setSearchQuery("")}
						/>
					)}
				</PersonTabToolbar>

				{tab === "notes" ? (
					<PersonNotesList
						notes={notes}
						person={person}
						searchQuery={deferredSearchQuery}
						statusFilter={notesStatusFilter}
					/>
				) : (
					<PersonRemindersList
						reminders={reminders}
						person={person}
						searchQuery={deferredSearchQuery}
						statusFilter={remindersStatusFilter}
					/>
				)}
			</div>
		</div>
	)
}
