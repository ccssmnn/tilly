import { useDeferredValue, useState } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl } from "#shared/intl/setup"
import { useNotesData } from "../lib/data"
import { handleCreateNote } from "../lib/note-actions"
import { Dialog, DialogContent } from "#shared/ui/dialog"
import { VirtualizedList } from "#app/components/virtualized-list"
import { NotesPageTitle } from "../parts/notes-page-title"
import {
	NotesToolbar,
	NotesSearch,
	NewNoteButton,
} from "../parts/notes-toolbar"
import { ListFilterButton } from "#app/features/list-filter-button"
import {
	EmptyNotes,
	EmptyNoteSearch,
	NoDeletedNotes,
} from "../parts/note-fallbacks"
import { NewNoteForm } from "../widgets/new-note-form"
import { ActiveNote } from "../widgets/active-note"
import { DeletedNote } from "../widgets/deleted-note"

type StatusFilter = "active" | "deleted"

type NotesScreenProps = {
	fallback: Parameters<typeof useNotesData>[0]
}

export function NotesScreen({ fallback }: NotesScreenProps) {
	let t = useIntl()
	let me = useAccount(UserAccount)
	let [query, setQuery] = useState("")
	let [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
	let [listFilter, setListFilter] = useState<string | null>(null)
	let [newNoteOpen, setNewNoteOpen] = useState(false)
	let deferredQuery = useDeferredValue(query)

	let statusOptions = [
		{ value: "active", label: t("filter.status.active") },
		{ value: "deleted", label: t("filter.status.deleted") },
	]

	let { notes, people, total } = useNotesData(fallback, {
		query: deferredQuery,
		statusFilter,
		listFilter,
	})

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
									query={query}
									onChange={setQuery}
									trailing={
										<ListFilterButton
											people={people}
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
