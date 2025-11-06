import { create } from "zustand"
import { persist } from "zustand/middleware"
import { del, get, set } from "idb-keyval"
import { z } from "zod"
import { format } from "date-fns"
import type { PersistStorage } from "zustand/middleware"
import type { TillyUIMessage } from "#shared/tools/tools"
import { tryCatch } from "#shared/lib/trycatch"

interface AppState {
	peopleSearchQuery: string
	setPeopleSearchQuery: (query: string) => void

	remindersSearchQuery: string
	setRemindersSearchQuery: (query: string) => void

	notesSearchQuery: string
	setNotesSearchQuery: (query: string) => void

	chat: TillyUIMessage[]
	setChat: (messages: Array<TillyUIMessage>) => void
	addChatMessage: (message: TillyUIMessage) => void
	clearChat: () => void

	pwaInstallHintDismissed: boolean
	setPWAInstallHintDismissed: (dismissed: boolean) => void

	hideInstallNavItem: boolean
	setHideInstallNavItem: (hidden: boolean) => void

	clearChatHintDismissed: boolean
	setClearChatHintDismissed: (dismissed: boolean) => void

	tourSkipped: boolean
	setTourSkipped: (skipped: boolean) => void

	lastAccessDate: string
}

let storeStateSchema = z.object({
	chat: z.array(z.any()),
	pwaInstallHintDismissed: z.boolean(),
	hideInstallNavItem: z.boolean(),
	clearChatHintDismissed: z.boolean(),
	tourSkipped: z.boolean(),
	lastAccessDate: z.string(),
})

type PersistedState = Pick<
	AppState,
	| "chat"
	| "pwaInstallHintDismissed"
	| "hideInstallNavItem"
	| "clearChatHintDismissed"
	| "tourSkipped"
	| "lastAccessDate"
>

let initialPersistedState: PersistedState = {
	chat: [],
	pwaInstallHintDismissed: false,
	hideInstallNavItem: false,
	clearChatHintDismissed: false,
	tourSkipped: false,
	lastAccessDate: format(new Date(), "yyyy-MM-dd"),
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

			chat: [],
			setChat: msgs => set({ chat: msgs }),
			addChatMessage: msg => set(s => ({ chat: [...s.chat, msg] })),
			clearChat: () => set({ chat: [] }),

			pwaInstallHintDismissed: false,
			setPWAInstallHintDismissed: (dismissed: boolean) =>
				set({ pwaInstallHintDismissed: dismissed }),

			hideInstallNavItem: false,
			setHideInstallNavItem: (hidden: boolean) =>
				set({ hideInstallNavItem: hidden }),

			clearChatHintDismissed: false,
			setClearChatHintDismissed: (dismissed: boolean) =>
				set({ clearChatHintDismissed: dismissed }),

			tourSkipped: false,
			setTourSkipped: (skipped: boolean) => set({ tourSkipped: skipped }),

			lastAccessDate: format(new Date(), "yyyy-MM-dd"),
		}),
		{
			name: "tilly-app-storage",
			storage: createIdbStorage(storeStateSchema, initialPersistedState),
			partialize: (state): PersistedState => ({
				chat: state.chat,
				pwaInstallHintDismissed: false,
				hideInstallNavItem: state.hideInstallNavItem,
				clearChatHintDismissed: state.clearChatHintDismissed,
				tourSkipped: state.tourSkipped,
				lastAccessDate: state.lastAccessDate,
			}),
			onRehydrateStorage: () => state => {
				if (!state) return

				let today = format(new Date(), "yyyy-MM-dd")
				let isNewDay = state.lastAccessDate !== today

				if (isNewDay) {
					// Reset chat and search queries for new day
					useAppStore.setState({
						peopleSearchQuery: "",
						remindersSearchQuery: "",
						notesSearchQuery: "",
						chat: [],
						lastAccessDate: today,
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
		chat: initialPersistedState.chat,
		pwaInstallHintDismissed: initialPersistedState.pwaInstallHintDismissed,
		hideInstallNavItem: initialPersistedState.hideInstallNavItem,
		clearChatHintDismissed: initialPersistedState.clearChatHintDismissed,
		tourSkipped: initialPersistedState.tourSkipped,
		lastAccessDate: initialPersistedState.lastAccessDate,
	})

	let clearResult = tryCatch(() => useAppStore.persist.clearStorage())
	if (!clearResult.ok) {
		console.error("Failed to clear persisted app store", clearResult.error)
	}
}
