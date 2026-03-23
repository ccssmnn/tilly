import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createIdbStorage } from "#app/lib/idb-storage"
import { z } from "zod"

type StatusFilter = "active" | "deleted"

interface NotesStoreState {
	searchQuery: string
	setSearchQuery: (query: string) => void

	listFilter: string | null
	setListFilter: (filter: string | null) => void

	statusFilter: StatusFilter
	setStatusFilter: (filter: StatusFilter) => void
}

let persistedSchema = z.object({
	listFilter: z.string().nullable(),
	statusFilter: z.enum(["active", "deleted"]),
})

type PersistedState = Pick<NotesStoreState, "listFilter" | "statusFilter">

let initialPersistedState: PersistedState = {
	listFilter: null,
	statusFilter: "active",
}

export let useNotesStore = create<NotesStoreState>()(
	persist(
		set => ({
			searchQuery: "",
			setSearchQuery: (query: string) => set({ searchQuery: query }),

			listFilter: null,
			setListFilter: (filter: string | null) => set({ listFilter: filter }),

			statusFilter: "active",
			setStatusFilter: (filter: StatusFilter) => set({ statusFilter: filter }),
		}),
		{
			name: "tilly-notes-store",
			storage: createIdbStorage(persistedSchema, initialPersistedState),
			partialize: (state): PersistedState => ({
				listFilter: state.listFilter,
				statusFilter: state.statusFilter,
			}),
		},
	),
)
