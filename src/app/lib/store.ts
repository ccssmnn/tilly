import { create } from "zustand"
import { persist } from "zustand/middleware"
import { del, get, set } from "idb-keyval"
import { z } from "zod"
import { format } from "date-fns"
import type { PersistStorage } from "zustand/middleware"
import { tryCatch } from "#shared/lib/trycatch"

type PeopleSortMode = "recent" | "alphabetical"
type PeopleStatusFilter = "active" | "deleted"
type RemindersStatusFilter = "active" | "done" | "deleted"
type NotesStatusFilter = "active" | "deleted"

interface AppState {
	peopleSearchQuery: string
	setPeopleSearchQuery: (query: string) => void

	remindersSearchQuery: string
	setRemindersSearchQuery: (query: string) => void

	notesSearchQuery: string
	setNotesSearchQuery: (query: string) => void

	peopleListFilter: string | null
	setPeopleListFilter: (filter: string | null) => void

	remindersListFilter: string | null
	setRemindersListFilter: (filter: string | null) => void

	notesListFilter: string | null
	setNotesListFilter: (filter: string | null) => void

	peopleSortMode: PeopleSortMode
	setPeopleSortMode: (mode: PeopleSortMode) => void

	peopleStatusFilter: PeopleStatusFilter
	setPeopleStatusFilter: (filter: PeopleStatusFilter) => void

	remindersStatusFilter: RemindersStatusFilter
	setRemindersStatusFilter: (filter: RemindersStatusFilter) => void

	notesStatusFilter: NotesStatusFilter
	setNotesStatusFilter: (filter: NotesStatusFilter) => void

	pwaInstallHintDismissed: boolean
	setPWAInstallHintDismissed: (dismissed: boolean) => void

	hideInstallNavItem: boolean
	setHideInstallNavItem: (hidden: boolean) => void

	tourSkipped: boolean
	setTourSkipped: (skipped: boolean) => void

	lastAccessDate: string
}

let storeStateSchema = z.object({
	pwaInstallHintDismissed: z.boolean(),
	hideInstallNavItem: z.boolean(),
	tourSkipped: z.boolean(),
	lastAccessDate: z.string(),
	peopleListFilter: z.string().nullable(),
	remindersListFilter: z.string().nullable(),
	notesListFilter: z.string().nullable(),
	peopleSortMode: z.enum(["recent", "alphabetical"]),
	peopleStatusFilter: z.enum(["active", "deleted"]),
	remindersStatusFilter: z.enum(["active", "done", "deleted"]),
	notesStatusFilter: z.enum(["active", "deleted"]),
})

type PersistedState = Pick<
	AppState,
	| "pwaInstallHintDismissed"
	| "hideInstallNavItem"
	| "tourSkipped"
	| "lastAccessDate"
	| "peopleListFilter"
	| "remindersListFilter"
	| "notesListFilter"
	| "peopleSortMode"
	| "peopleStatusFilter"
	| "remindersStatusFilter"
	| "notesStatusFilter"
>

let initialPersistedState: PersistedState = {
	pwaInstallHintDismissed: false,
	hideInstallNavItem: false,
	tourSkipped: false,
	lastAccessDate: format(new Date(), "yyyy-MM-dd"),
	peopleListFilter: null,
	remindersListFilter: null,
	notesListFilter: null,
	peopleSortMode: "recent",
	peopleStatusFilter: "active",
	remindersStatusFilter: "active",
	notesStatusFilter: "active",
}

type StorageValue<T> = {
	state: T
	version: number
}

function createIdbStorage<T>(
	schema: z.ZodSchema<T>,
	initialState: T,
	version: number = 1,
): PersistStorage<T> {
	return {
		getItem: async function (name): Promise<StorageValue<T> | null> {
			try {
				let item = await get(name)
				if (!item) return null

				let check = z
					.object({ state: schema, version: z.number() })
					.safeParse(item)

				if (!check.success) {
					console.warn("Invalid store data, using initial state", check.error)
					return { state: initialState, version }
				}

				return {
					state: check.data.state as T,
					version: check.data.version,
				}
			} catch (error) {
				console.error("Failed to get store from idb", error)
				return { state: initialState, version }
			}
		},
		setItem: async function (name, value) {
			try {
				await set(name, value)
			} catch (error) {
				console.error("Failed to persist store to idb", error)
			}
		},
		removeItem: async function (name) {
			try {
				await del(name)
			} catch (error) {
				console.error("Failed to remove store from idb", error)
			}
		},
	}
}

export let fileUtils = {
	fileToSerializable: async function (file: File) {
		return {
			name: file.name,
			type: file.type,
			size: file.size,
			lastModified: file.lastModified,
			data: await fileToBase64(file),
		}
	},

	serializableToFile: function (obj: {
		name: string
		type: string
		size: number
		lastModified: number
		data: string
	}): File {
		let bytes = atob(obj.data)
		let array = new Uint8Array(bytes.length)
		for (let i = 0; i < bytes.length; i++) {
			array[i] = bytes.charCodeAt(i)
		}
		return new File([array], obj.name, {
			type: obj.type,
			lastModified: obj.lastModified,
		})
	},
}

function fileToBase64(file: File): Promise<string> {
	return new Promise(function (resolve, reject) {
		let reader = new FileReader()
		reader.onload = function () {
			let result = reader.result as string
			let base64 = result.split(",")[1]
			resolve(base64)
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}

export let useAppStore = create<AppState>()(
	persist(
		set => ({
			peopleSearchQuery: "",
			setPeopleSearchQuery: (query: string) =>
				set({ peopleSearchQuery: query }),

			remindersSearchQuery: "",
			setRemindersSearchQuery: (query: string) =>
				set({ remindersSearchQuery: query }),

			notesSearchQuery: "",
			setNotesSearchQuery: (query: string) => set({ notesSearchQuery: query }),

			peopleListFilter: null,
			setPeopleListFilter: (filter: string | null) =>
				set({ peopleListFilter: filter }),

			remindersListFilter: null,
			setRemindersListFilter: (filter: string | null) =>
				set({ remindersListFilter: filter }),

			notesListFilter: null,
			setNotesListFilter: (filter: string | null) =>
				set({ notesListFilter: filter }),

			peopleSortMode: "recent",
			setPeopleSortMode: (mode: PeopleSortMode) =>
				set({ peopleSortMode: mode }),

			peopleStatusFilter: "active",
			setPeopleStatusFilter: (filter: PeopleStatusFilter) =>
				set({ peopleStatusFilter: filter }),

			remindersStatusFilter: "active",
			setRemindersStatusFilter: (filter: RemindersStatusFilter) =>
				set({ remindersStatusFilter: filter }),

			notesStatusFilter: "active",
			setNotesStatusFilter: (filter: NotesStatusFilter) =>
				set({ notesStatusFilter: filter }),

			pwaInstallHintDismissed: false,
			setPWAInstallHintDismissed: (dismissed: boolean) =>
				set({ pwaInstallHintDismissed: dismissed }),

			hideInstallNavItem: false,
			setHideInstallNavItem: (hidden: boolean) =>
				set({ hideInstallNavItem: hidden }),

			tourSkipped: false,
			setTourSkipped: (skipped: boolean) => set({ tourSkipped: skipped }),

			lastAccessDate: format(new Date(), "yyyy-MM-dd"),
		}),
		{
			name: "tilly-app-storage",
			storage: createIdbStorage(storeStateSchema, initialPersistedState),
			partialize: (state): PersistedState => ({
				pwaInstallHintDismissed: false,
				hideInstallNavItem: state.hideInstallNavItem,
				tourSkipped: state.tourSkipped,
				lastAccessDate: state.lastAccessDate,
				peopleListFilter: state.peopleListFilter,
				remindersListFilter: state.remindersListFilter,
				notesListFilter: state.notesListFilter,
				peopleSortMode: state.peopleSortMode,
				peopleStatusFilter: state.peopleStatusFilter,
				remindersStatusFilter: state.remindersStatusFilter,
				notesStatusFilter: state.notesStatusFilter,
			}),
			onRehydrateStorage: () => state => {
				if (!state) return

				let today = format(new Date(), "yyyy-MM-dd")
				let isNewDay = state.lastAccessDate !== today

				if (isNewDay) {
					// Reset search queries and filters for new day
					useAppStore.setState({
						peopleSearchQuery: "",
						remindersSearchQuery: "",
						notesSearchQuery: "",
						lastAccessDate: today,
						peopleSortMode: "recent",
						peopleStatusFilter: "active",
						remindersStatusFilter: "active",
						notesStatusFilter: "active",
					})
				}
			},
		},
	),
)

export function resetAppStore(): void {
	useAppStore.setState({
		peopleSearchQuery: "",
		remindersSearchQuery: "",
		notesSearchQuery: "",
		pwaInstallHintDismissed: initialPersistedState.pwaInstallHintDismissed,
		hideInstallNavItem: initialPersistedState.hideInstallNavItem,
		tourSkipped: initialPersistedState.tourSkipped,
		lastAccessDate: initialPersistedState.lastAccessDate,
	})

	let clearResult = tryCatch(() => useAppStore.persist.clearStorage())
	if (!clearResult.ok) {
		console.error("Failed to clear persisted app store", clearResult.error)
	}
}
