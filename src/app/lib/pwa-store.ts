import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createIdbStorage } from "#app/lib/idb-storage"
import { z } from "zod"

interface PWAStoreState {
	installHintDismissed: boolean
	setInstallHintDismissed: (dismissed: boolean) => void
}

let persistedSchema = z.object({
	installHintDismissed: z.boolean(),
})

export let usePWAStore = create<PWAStoreState>()(
	persist(
		set => ({
			installHintDismissed: false,
			setInstallHintDismissed: (dismissed: boolean) =>
				set({ installHintDismissed: dismissed }),
		}),
		{
			name: "tilly-pwa-store",
			storage: createIdbStorage(persistedSchema, {
				installHintDismissed: false,
			}),
		},
	),
)
