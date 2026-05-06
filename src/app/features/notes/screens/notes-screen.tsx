import { useDeferredValue, useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl } from "#shared/intl/setup"
import { useNotesData } from "../lib/data"
import { useNotesStore } from "../lib/store"
import { handleCreateNote } from "../lib/note-actions"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import { VirtualizedList } from "#app/components/virtualized-list"
import { NotesPageTitle } from "../parts/notes-page-title"
import {
	NotesToolbar,
	NotesSearch,
	NewNoteButton,
} from "../parts/notes-toolbar"
import {
	ListFilter,
	ListFilterStatus,
	ListFilterLists,
	useAvailableLists,
} from "#app/features/people"
import {
	EmptyNotes,
	EmptyNoteSearch,
	NoDeletedNotes,
} from "../parts/note-fallbacks"
import { NewNoteForm } from "../parts/new-note-form"
import { ActiveNote } from "../widgets/active-note"
import { DeletedNote } from "../widgets/deleted-note"

type NotesScreenProps = {
	fallback: Parameters<typeof useNotesData>[0]
}

export function NotesScreen({ fallback }: NotesScreenProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let {
		searchQuery,
		setSearchQuery,
		listFilter,
		setListFilter,
		statusFilter,
		setStatusFilter,
	} = useNotesStore()
	let [newNoteOpen, setNewNoteOpen] = useState(false)
	let deferredQuery = useDeferredValue(searchQuery)

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	let { notes, people, total } = useNotesData(fallback, {
		query: deferredQuery,
		statusFilter,
		listFilter,
	})
	let availableLists = useAvailableLists(people)

	async function onCreateNote(
		personId: string,
		values: { content: string; pinned: boolean; images?: File[] },
	) {
		if (!me.$isLoaded) return
		let result = await handleCreateNote(me, personId, values, t)
		if (result.ok) setNewNoteOpen(false)
	}

	return (
		<>
			<VirtualizedList
				items={notes}
				fallback={
					total === 0 ? (
						<EmptyNotes />
					) : deferredQuery || listFilter ? (
						<EmptyNoteSearch />
					) : statusFilter === "deleted" ? (
						<NoDeletedNotes />
					) : null
				}
				staticHeader={
					<>
						<NotesPageTitle />
						{total > 0 && (
							<NotesToolbar>
								<NotesSearch
									query={searchQuery}
									onChange={setSearchQuery}
									trailing={
										<ListFilter
											hasActiveFilters={
												listFilter !== null || statusFilter !== "active"
											}
										>
											<ListFilterStatus
												options={statusOptions}
												value={statusFilter}
												onChange={f =>
													setStatusFilter(f as "active" | "deleted")
												}
											/>
											<ListFilterLists
												people={people}
												availableLists={availableLists}
												value={listFilter}
												onChange={setListFilter}
											/>
										</ListFilter>
									}
								/>
								<NewNoteButton onClick={() => setNewNoteOpen(true)} />
							</NotesToolbar>
						)}
					</>
				}
				renderItem={({ note, person }) =>
					note.deletedAt ? (
						<DeletedNote
							note={note}
							person={person}
							searchQuery={deferredQuery}
						/>
					) : (
						<ActiveNote
							note={note}
							person={person}
							searchQuery={deferredQuery}
						/>
					)
				}
			/>

			<Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
				<DialogContent>
					<NewNoteForm
						people={people}
						onSubmit={onCreateNote}
						onCancel={() => setNewNoteOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
