import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createIdbStorage } from "#app/lib/idb-storage"
import { z } from "zod"

type StatusFilter = "active" | "done" | "deleted"

interface RemindersStoreState {
	searchQuery: string
	setSearchQuery: (query: string) => void

	listFilter: string | null
	setListFilter: (filter: string | null) => void

	statusFilter: StatusFilter
	setStatusFilter: (filter: StatusFilter) => void
}

let persistedSchema = z.object({
	listFilter: z.string().nullable(),
	statusFilter: z.enum(["active", "done", "deleted"]),
})

type PersistedState = Pick<RemindersStoreState, "listFilter" | "statusFilter">

let initialPersistedState: PersistedState = {
	listFilter: null,
	statusFilter: "active",
}

export let useRemindersStore = create<RemindersStoreState>()(
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
			name: "tilly-reminders-store",
			storage: createIdbStorage(persistedSchema, initialPersistedState),
			partialize: (state): PersistedState => ({
				listFilter: state.listFilter,
				statusFilter: state.statusFilter,
			}),
		},
	),
)
