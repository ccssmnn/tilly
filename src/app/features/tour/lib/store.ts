import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createIdbStorage } from "#app/lib/idb-storage"
import { z } from "zod"

interface TourStoreState {
	tourSkipped: boolean
	setTourSkipped: (skipped: boolean) => void
}

let persistedSchema = z.object({
	tourSkipped: z.boolean(),
})

export let useTourStore = create<TourStoreState>()(
	persist(
		set => ({
			tourSkipped: false,
			setTourSkipped: (skipped: boolean) => set({ tourSkipped: skipped }),
		}),
		{
			name: "tilly-tour-store",
			storage: createIdbStorage(persistedSchema, { tourSkipped: false }),
			partialize: state => ({ tourSkipped: state.tourSkipped }),
		},
	),
)
