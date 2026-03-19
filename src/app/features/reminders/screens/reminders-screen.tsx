import { useDeferredValue, useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl } from "#shared/intl/setup"
import { useRemindersData } from "../lib/data"
import { handleCreateReminder } from "../lib/reminder-actions"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import { VirtualizedList } from "#app/components/virtualized-list"
import { RemindersPageTitle } from "../parts/reminders-page-title"
import {
	ReminderToolbar,
	ReminderSearch,
	NewReminderButton,
} from "../parts/reminder-toolbar"
import { ListFilterButton, useAvailableLists } from "#app/features/people"
import {
	EmptyReminders,
	EmptyReminderSearch,
	AllCaughtUp,
	NoDoneReminders,
	NoDeletedReminders,
} from "../parts/reminder-fallbacks"
import { NewReminderForm } from "../widgets/new-reminder-form"
import { ActiveReminder } from "../widgets/active-reminder"
import { DoneReminder } from "../widgets/done-reminder"
import { DeletedReminder } from "../widgets/deleted-reminder"
import type { ReminderFieldValues } from "../parts/reminder-fields"

type StatusFilter = "active" | "done" | "deleted"

type RemindersScreenProps = {
	fallback: Parameters<typeof useRemindersData>[0]
}

export function RemindersScreen({ fallback }: RemindersScreenProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [query, setQuery] = useState("")
	let [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
	let [listFilter, setListFilter] = useState<string | null>(null)
	let [newReminderOpen, setNewReminderOpen] = useState(false)
	let deferredQuery = useDeferredValue(query)

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "done", label: t("filter.status.done") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	let { reminders, people, total } = useRemindersData(fallback, {
		query: deferredQuery,
		statusFilter,
		listFilter,
	})
	let availableLists = useAvailableLists(people)

	async function onCreateReminder(
		personId: string,
		values: ReminderFieldValues,
	) {
		if (!me.$isLoaded) return
		let result = await handleCreateReminder(me, personId, values, t)
		if (result.ok) setNewReminderOpen(false)
	}

	return (
		<>
			<VirtualizedList
				items={reminders}
				fallback={
					total === 0 ? (
						<EmptyReminders />
					) : deferredQuery || listFilter ? (
						<EmptyReminderSearch />
					) : statusFilter === "done" ? (
						<NoDoneReminders />
					) : statusFilter === "deleted" ? (
						<NoDeletedReminders />
					) : (
						<AllCaughtUp />
					)
				}
				staticHeader={
					<>
						<RemindersPageTitle />
						<ReminderToolbar>
							<ReminderSearch
								query={query}
								onChange={setQuery}
								trailing={
									<ListFilterButton
										people={people}
											availableLists={availableLists}
										listFilter={listFilter}
										onListFilterChange={setListFilter}
										statusOptions={statusOptions}
										statusFilter={statusFilter}
										onStatusFilterChange={f =>
											setStatusFilter(f as StatusFilter)
										}
									/>
								}
							/>
							<NewReminderButton onClick={() => setNewReminderOpen(true)} />
						</ReminderToolbar>
					</>
				}
				renderItem={({ reminder, person }) =>
					reminder.deletedAt ? (
						<DeletedReminder
							reminder={reminder}
							person={person}
							searchQuery={deferredQuery}
						/>
					) : reminder.done ? (
						<DoneReminder
							reminder={reminder}
							person={person}
							searchQuery={deferredQuery}
						/>
					) : (
						<ActiveReminder
							reminder={reminder}
							person={person}
							searchQuery={deferredQuery}
						/>
					)
				}
			/>

			<Dialog open={newReminderOpen} onOpenChange={setNewReminderOpen}>
				<DialogContent>
					<NewReminderForm
						people={people}
						onSubmit={onCreateReminder}
						onCancel={() => setNewReminderOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
