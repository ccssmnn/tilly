import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createIdbStorage } from "#app/lib/idb-storage"
import { z } from "zod"

type SortMode = "recent" | "alphabetical"
type StatusFilter = "active" | "deleted"

interface PeopleStoreState {
	searchQuery: string
	setSearchQuery: (query: string) => void

	listFilter: string | null
	setListFilter: (filter: string | null) => void

	sortMode: SortMode
	setSortMode: (mode: SortMode) => void

	statusFilter: StatusFilter
	setStatusFilter: (filter: StatusFilter) => void
}

let persistedSchema = z.object({
	listFilter: z.string().nullable(),
	sortMode: z.enum(["recent", "alphabetical"]),
	statusFilter: z.enum(["active", "deleted"]),
})

type PersistedState = Pick<
	PeopleStoreState,
	"listFilter" | "sortMode" | "statusFilter"
>

let initialPersistedState: PersistedState = {
	listFilter: null,
	sortMode: "recent",
	statusFilter: "active",
}

export let usePeopleStore = create<PeopleStoreState>()(
	persist(
		set => ({
			searchQuery: "",
			setSearchQuery: (query: string) => set({ searchQuery: query }),

			listFilter: null,
			setListFilter: (filter: string | null) => set({ listFilter: filter }),

			sortMode: "recent",
			setSortMode: (mode: SortMode) => set({ sortMode: mode }),

			statusFilter: "active",
			setStatusFilter: (filter: StatusFilter) => set({ statusFilter: filter }),
		}),
		{
			name: "tilly-people-store",
			storage: createIdbStorage(persistedSchema, initialPersistedState),
			partialize: (state): PersistedState => ({
				listFilter: state.listFilter,
				sortMode: state.sortMode,
				statusFilter: state.statusFilter,
			}),
		},
	),
)
